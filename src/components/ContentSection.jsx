import { getProductionBySlug } from '../data/productions';
import './ContentSection.css';

export function ContentSection({ heading, items, renderMeta }) {
  return (
    <section className="content-section">
      <h2 className="content-section__heading">{heading}</h2>
      <div className="content-section__row">
        {items.map((item) => {
          const production = getProductionBySlug(item.productionSlug);
          return (
            <article key={item.id} className="content-card">
              <span className="content-card__tag">{production?.title}</span>
              <h3 className="content-card__title">{item.title}</h3>
              <p className="content-card__excerpt">{item.excerpt}</p>
              <div className="content-card__meta">{renderMeta(item)}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
