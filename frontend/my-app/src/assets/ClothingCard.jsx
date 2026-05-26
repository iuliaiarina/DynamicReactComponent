import './ClothingCard.css'

export function ClothingCard({ children, name, brand, image, link }) {
  return (
    <article className="clothing-card">
      <header className="clothing-card__header">
        <h2 className="clothing-card__name">{name}</h2>
        {brand && <p className="clothing-card__brand">{brand}</p>}
        {link && (
          <a
            className="clothing-card__arrow-link"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${name}`}
            title="Open product page"
          >
            <span aria-hidden="true">↗</span>
          </a>
        )}
        
      </header>
      {image && <img src={image} alt={name} />}

      <div className="clothing-card__details">{children}</div>
    </article>
  )
}
