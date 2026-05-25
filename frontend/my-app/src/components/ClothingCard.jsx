import ReactMarkdown from 'react-markdown'
import './ClothingCard.css'

const FIELD_ICONS = {
  'sizes available': '📐',
  'regular price': '🏷️',
  'discounted price': '💸',
  style: '✨',
  length: '📏',
  material: '🧵',
  color: '🎨',
  'link to the product page': '🔗',
  description: '📝',
}

/**
 * Parses a list of bullet-point strings into structured fields.
 * Returns { fields: [{label, value}], link }
 */
function parseDetails(bulletLines) {
  const fields = []
  let link = null

  for (const line of bulletLines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) {
      fields.push({ label: null, value: line.trim() })
      continue
    }

    const label = line.slice(0, colonIdx).trim().toLowerCase()
    const value = line.slice(colonIdx + 1).trim()

    if (label === 'link to the product page') {
      link = value || null
    }

    fields.push({ label, value })
  }

  return { fields, link }
}

const mdComponents = {
  p: ({ children }) => <span>{children}</span>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="card-link">
      {children}
    </a>
  ),
}

export function ClothingCard({ name, bulletLines }) {
  const { fields, link } = parseDetails(bulletLines)

  return (
    <article className="clothing-card">
      <header className="clothing-card__header">
        <h2 className="clothing-card__name">{name}</h2>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="clothing-card__cta"
          >
            View item →
          </a>
        )}
      </header>

      <ul className="clothing-card__details">
        {fields.map(({ label, value }, i) => {
          if (!value) return null
          const icon = label ? (FIELD_ICONS[label] ?? '•') : '•'
          const displayLabel = label
            ? label.charAt(0).toUpperCase() + label.slice(1)
            : null

          return (
            <li key={i} className="clothing-card__detail-row">
              <span className="clothing-card__detail-icon">{icon}</span>
              {displayLabel && (
                <span className="clothing-card__detail-label">{displayLabel}:</span>
              )}
              <span className="clothing-card__detail-value">
                <ReactMarkdown components={mdComponents}>{value}</ReactMarkdown>
              </span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
