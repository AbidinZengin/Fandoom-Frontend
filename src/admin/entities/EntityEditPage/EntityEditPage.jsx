import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import GlassButton from '../../GlassButton/GlassButton';
import IconButton from '../../IconButton/IconButton';
import { ArrowLeftIcon, TrashIcon } from '../../icons';
import PageHeader from '../../PageHeader/PageHeader';
import TabPills from '../../TabPills/TabPills';
import { pathOf } from '../adminPath';
import ChildPanel from '../ChildPanel/ChildPanel';
import EntityForm from '../EntityForm/EntityForm';
import { ENTITIES } from '../registry';
import { useEntityEditor } from '../useEntityEditor';
import styles from './EntityEditPage.module.css';

const permissionMessage = 'Bunun için yetkin yok.';

// `chain`: URL'den çözülen halkalar; son halka düzenlenen kayıt, bir öncekisi
// (varsa) ebeveyn. Hook'u koşulsuz çağırabilmek için ayrı `Editor`.
export default function EntityEditPage({ chain }) {
  const current = chain.at(-1);
  const parent = chain.length > 1 ? chain.at(-2) : null;
  return (
    <Editor
      entity={current.entity}
      id={current.isNew ? undefined : current.id}
      chain={chain}
      parent={parent}
    />
  );
}

function Editor({ entity, id, chain, parent }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const editor = useEntityEditor(entity, id, parent);
  const { draft, loading, loadError, saving, saveError, isDirty, recoverable } = editor;

  const childEntities = (entity.children ?? []).map((key) => ENTITIES[key]);
  const tabs = id && childEntities.length > 0
    ? [{ key: 'general', label: 'Genel' }, ...childEntities.map((c) => ({ key: c.key, label: c.label }))]
    : null;
  const activeTab = tabs?.some((tab) => tab.key === params.get('tab')) ? params.get('tab') : 'general';
  const activeChild = childEntities.find((c) => c.key === activeTab);

  const parentChain = chain.slice(0, -1);
  const backTo = parent ? `${pathOf(parentChain)}?tab=${entity.key}` : `/admin/${entity.key}`;

  const handleSave = async () => {
    const saved = await editor.save();
    if (saved && !id) navigate(pathOf([...parentChain, { entity, id: saved.id }]), { replace: true });
  };

  const handleDelete = async () => {
    if (await editor.remove()) navigate(backTo, { replace: true });
  };

  if (loading) return <p className={styles['entityEdit__status']}>Yükleniyor…</p>;

  if (loadError) {
    return (
      <div className={styles['entityEdit__status']}>
        <p>
          {loadError.status === 403
            ? permissionMessage
            : loadError.status === 404
              ? 'Kayıt bulunamadı.'
              : 'Kayıt yüklenemedi.'}
        </p>
        {loadError.status === 404 ? (
          <GlassButton to={backTo}>Listeye dön</GlassButton>
        ) : (
          <GlassButton onClick={editor.reload}>Tekrar dene</GlassButton>
        )}
      </div>
    );
  }

  // Form dışında kalan alanlara ait doğrulama hataları banner'da toplanır.
  const formKeys = new Set(entity.groups.flatMap((g) => g.fields.map((f) => f.key)));
  const fieldErrors = saveError?.fieldErrors ?? null;
  const strayErrors = fieldErrors
    ? Object.entries(fieldErrors).filter(([key]) => !formKeys.has(key))
    : [];
  const recordTitle = entity.titleOf ? entity.titleOf(draft) : draft[entity.titleKey ?? 'title'];

  return (
    <div className={styles['entityEdit']}>
      <Link to={backTo} className={styles['entityEdit__back']}>
        <span className={styles['entityEdit__backIcon']}>
          <ArrowLeftIcon />
        </span>
        {entity.label}
      </Link>

      <PageHeader
        title={id ? `${entity.singular} düzenle` : `Yeni ${entity.singular.toLocaleLowerCase('tr')}`}
        subtitle={isDirty ? 'Kaydedilmemiş değişiklikler var' : recordTitle || undefined}
      >
        {entity.deletable && id && !confirmingDelete && (
          <IconButton label={`${entity.singular} sil`} onClick={() => setConfirmingDelete(true)} danger>
            <TrashIcon />
          </IconButton>
        )}
        {confirmingDelete && (
          <span className={styles['entityEdit__confirm']}>
            Silinsin mi?
            <button type="button" className={styles['entityEdit__confirmDelete']} onClick={handleDelete} disabled={saving}>
              Sil
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Vazgeç
            </button>
          </span>
        )}
        <GlassButton onClick={handleSave} disabled={saving || (Boolean(id) && !isDirty)}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </GlassButton>
      </PageHeader>

      {recoverable && (
        <div className={styles['entityEdit__notice']}>
          <p>Kaydedilmemiş bir taslak bulundu, geri yüklensin mi?</p>
          <div className={styles['entityEdit__noticeActions']}>
            <button type="button" onClick={editor.restoreBackup}>
              Geri yükle
            </button>
            <button type="button" onClick={editor.discardBackup}>
              Sil
            </button>
          </div>
        </div>
      )}

      {saveError && (!fieldErrors || strayErrors.length > 0) && (
        <div className={`${styles['entityEdit__notice']} ${styles['entityEdit__notice--error']}`}>
          {fieldErrors ? (
            strayErrors.map(([key, message]) => (
              <p key={key}>
                {key}: {message}
              </p>
            ))
          ) : (
            <p>{saveError.status === 403 ? permissionMessage : 'İşlem tamamlanamadı, tekrar dene.'}</p>
          )}
        </div>
      )}

      {tabs && (
        <TabPills
          tabs={tabs}
          active={activeTab}
          onChange={(key) => setParams(key === 'general' ? {} : { tab: key }, { replace: true })}
          label={`${entity.singular} bölümleri`}
        />
      )}

      {activeChild ? (
        <ChildPanel chain={chain} child={activeChild} />
      ) : (
        <EntityForm
          entity={entity}
          draft={draft}
          errors={fieldErrors}
          onChange={editor.setField}
          parent={parent}
        />
      )}
    </div>
  );
}
