import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassButton from '../../GlassButton/GlassButton';
import { ArrowUpRightIcon, PlusIcon } from '../../icons';
import { pathOf } from '../adminPath';
import { listChildren } from '../entities.api';
import listStyles from '../EntityListPage/EntityListPage.module.css';
import styles from './ChildPanel.module.css';

// Bir kaydın alt kayıtlarını (sezonlar, karakterler…) listeler. `chain`: üst
// halkaları içeren zincir (son halka = ebeveyn); `child`: alt varlık tanımı.
export default function ChildPanel({ chain, child }) {
  const parent = chain.at(-1);
  const { entity: parentEntity, id: parentId } = parent;
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(false);
    listChildren(child, { entity: parentEntity, id: parentId })
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [child, parentEntity, parentId]);

  const base = pathOf(chain);

  return (
    <section className={styles['childPanel']}>
      <div className={styles['childPanel__head']}>
        <h2 className={styles['childPanel__title']}>
          {child.label}
          {items && <span className={styles['childPanel__count']}>{items.length}</span>}
        </h2>
        <GlassButton to={`${base}/${child.key}/new`} icon={<PlusIcon />}>
          Yeni {child.singular.toLocaleLowerCase('tr')}
        </GlassButton>
      </div>

      {!items && !error && <p className={styles['childPanel__status']}>Yükleniyor…</p>}
      {error && <p className={styles['childPanel__status']}>Liste yüklenemedi.</p>}
      {items?.length === 0 && <p className={styles['childPanel__status']}>Henüz kayıt yok.</p>}

      {items?.length > 0 && (
        <ul className={listStyles['entityList__items']}>
          {items.map((item) => {
            const row = child.row(item);
            return (
              <li key={item.id}>
                <Link to={`${base}/${child.key}/${item.id}`} className={listStyles['entityList__row']}>
                  {row.image ? (
                    <img className={listStyles['entityList__thumb']} src={row.image} alt="" />
                  ) : (
                    <span className={listStyles['entityList__thumb']} aria-hidden="true" />
                  )}
                  <span className={listStyles['entityList__title']}>{row.title || 'Başlıksız'}</span>
                  {row.meta && <span className={listStyles['entityList__meta']}>{row.meta}</span>}
                  <span className={listStyles['entityList__arrow']}>
                    <ArrowUpRightIcon />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
