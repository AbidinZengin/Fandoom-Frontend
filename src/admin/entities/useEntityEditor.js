import { useCallback, useEffect, useMemo, useState } from 'react';
import { createEntity, deleteEntity, getEntity, updateEntity } from './entities.api';

const BACKUP_DEBOUNCE_MS = 800;
const backupKey = (entity, id, parent) =>
  `fandoom_admin_${parent ? `${parent.entity.key}${parent.id}_` : ''}${entity.key}_${id ?? 'new'}`;

// Formdaki boş değerleri backend'in beklediği hâle çevirir: boş metin/sayı/tarih
// → null (zorunlu alanlar hariç, onlar olduğu gibi gider).
function normalize(entity, draft) {
  const required = new Set(
    entity.groups.flatMap((g) => g.fields).filter((f) => f.required).map((f) => f.key),
  );
  const body = {};
  entity.requestKeys.forEach((key) => {
    const value = draft[key];
    body[key] = value === '' && !required.has(key) ? null : value ?? null;
  });
  return body;
}

// İç içe blok alanları (type: 'blocks') istek gövdesine YALNIZ değiştiyse girer:
// backend null/eksik listeyi "mevcut blokları koru" sayar, dolu liste ise hepsini
// yeniden yazar. id/orderIndex/_key sunucuya gitmez (sıra dizi sırasıdır).
const stripBlock = ({ id: _id, orderIndex: _order, _key, ...rest }) => rest;

function blocksOf(entity, data) {
  const out = {};
  entity.groups
    .flatMap((g) => g.fields)
    .filter((f) => f.type === 'blocks')
    .forEach((f) => {
      out[f.key] = (data?.[f.key] ?? []).map(stripBlock);
    });
  return out;
}

// Bir varlığın düzenleme yaşam döngüsü — yükleme, taslak/özgün farkı, kaydet,
// sil, hata eşleme ve yerel otomatik yedek. Tüm varlık editörleri bunu
// kullanır. `parent`: { entity, id } (alt varlıklarda üst halka, yoksa null).
export function useEntityEditor(entity, id, parent = null) {
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [recoverable, setRecoverable] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Yüklenen kayıt (veya yeni kayıt varsayılanları) hem özgün hem taslak olur.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    setRecoverable(null);

    const apply = (data) => {
      if (cancelled) return;
      // Tek-kayıt GET'i olmayan varlıklarda (trivia) kayıt listede bulunamayabilir.
      if (!data) {
        setLoadError({ status: 404 });
        setLoading(false);
        return;
      }
      setOriginal(data);
      setDraft(data);
      setLoading(false);
      try {
        const raw = localStorage.getItem(backupKey(entity, id, parent));
        if (raw) setRecoverable(JSON.parse(raw));
      } catch {
        // yedek okunamadı, yok sayılır
      }
    };

    if (!id) {
      apply({ ...entity.defaults });
    } else {
      getEntity(entity, id, parent)
        .then(apply)
        .catch((err) => {
          if (cancelled) return;
          setLoadError(err);
          setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, id, parent?.id, reloadToken]);

  const isDirty = useMemo(
    () =>
      Boolean(draft) &&
      (JSON.stringify(normalize(entity, draft)) !== JSON.stringify(normalize(entity, original)) ||
        JSON.stringify(blocksOf(entity, draft)) !== JSON.stringify(blocksOf(entity, original))),
    [entity, draft, original],
  );

  // Yerel yedek: kaydedilmemiş değişiklik varken taslak tarayıcıya yazılır.
  useEffect(() => {
    if (!isDirty) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(backupKey(entity, id, parent), JSON.stringify(draft));
      } catch {
        // kota dolu, yedek atlanır
      }
    }, BACKUP_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, id, parent?.id, draft, isDirty]);

  // Sekmeyi kapatırken kaydedilmemiş değişiklik uyarısı.
  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const setField = useCallback((key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    // JSON alanları sunucuya gitmeden doğrulanır: public sayfalar JSON.parse yapıyor,
    // bozuk bir değer sayfayı kırar.
    const invalid = {};
    entity.groups
      .flatMap((g) => g.fields)
      .filter((f) => f.type === 'json' && draft[f.key])
      .forEach((f) => {
        try {
          JSON.parse(draft[f.key]);
        } catch {
          invalid[f.key] = 'Geçerli bir JSON değil';
        }
      });
    if (Object.keys(invalid).length > 0) {
      setSaveError({ fieldErrors: invalid });
      return null;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const body = normalize(entity, draft);
      const draftBlocks = blocksOf(entity, draft);
      const originalBlocks = blocksOf(entity, original);
      Object.keys(draftBlocks).forEach((key) => {
        if (JSON.stringify(draftBlocks[key]) !== JSON.stringify(originalBlocks[key])) body[key] = draftBlocks[key];
      });
      const saved = id
        ? await updateEntity(entity, id, body, parent)
        : await createEntity(entity, body, parent);
      localStorage.removeItem(backupKey(entity, id, parent));
      setOriginal(saved);
      setDraft(saved);
      return saved;
    } catch (err) {
      setSaveError(err);
      return null;
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, id, parent?.id, draft, original]);

  const restoreBackup = () => {
    setDraft(recoverable);
    setRecoverable(null);
  };

  const discardBackup = () => {
    localStorage.removeItem(backupKey(entity, id, parent));
    setRecoverable(null);
  };

  // Başarıda true; hatada saveError'a yazıp false döner.
  const remove = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await deleteEntity(entity, id, parent);
      localStorage.removeItem(backupKey(entity, id, parent));
      return true;
    } catch (err) {
      setSaveError(err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    draft,
    loading,
    loadError,
    saving,
    saveError,
    isDirty,
    recoverable,
    setField,
    save,
    remove,
    reload: () => setReloadToken((n) => n + 1),
    restoreBackup,
    discardBackup,
  };
}
