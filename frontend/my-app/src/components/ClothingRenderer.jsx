import ReactMarkdown from 'react-markdown'
import { withMdx, mdxComponent } from 'react-markdown-with-mdx'
import { z } from 'zod'
import { useState } from 'react'
import { ClothingCard } from './ClothingCard'
import { ClothingCarousel } from './ClothingCarousel'
import './ClothingRenderer.css'

const MdxReactMarkdown = withMdx(ReactMarkdown)

function MdxProductCard({ id, name, brand, children }) {
  const bulletLines = []
  
  // Extract text content from rendered children (MDX elements).
  const extractText = (node) => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (!node) return ''
    if (Array.isArray(node)) return node.map(extractText).join(' ')
    if (node.props && node.props.children) {
      const text = extractText(node.props.children)
      // Keep line boundaries for block/list nodes to preserve field rows.
      if (node.type === 'li' || node.type === 'p' || node.type === 'div') {
        return `${text}\n`
      }
      return text
    }
    return ''
  }

  // Prefer extracting explicit list items from rendered MDX nodes.
  const collectListItems = (node, items) => {
    if (!node) return

    if (Array.isArray(node)) {
      for (const child of node) {
        collectListItems(child, items)
      }
      return
    }

    if (typeof node === 'string' || typeof node === 'number') {
      return
    }

    if (node.type === 'li') {
      const itemText = extractText(node.props?.children).trim()
      if (itemText) {
        items.push(itemText)
      }
      return
    }

    collectListItems(node.props?.children, items)
  }

  const normalizeBulletLine = (line) => {
    const trimmed = line.trim()
    if (!trimmed) return null

    // Remove leading markdown list marker.
    const withoutMarker = trimmed.replace(/^[-*]\s+/, '')

    // Match "**Field:** value" exactly as in the prompt format.
    const boldMatch = withoutMarker.match(/^\*\*([^*]+)\*\*:\s*(.+)$/)
    if (boldMatch) {
      return `${boldMatch[1].trim()}: ${boldMatch[2].trim()}`
    }

    // Match "Field: value" fallback.
    const colonIdx = withoutMarker.indexOf(':')
    if (colonIdx > 0) {
      const label = withoutMarker.slice(0, colonIdx).trim()
      const value = withoutMarker.slice(colonIdx + 1).trim()
      if (label && value) {
        return `${label}: ${value}`
      }
    }

    return null
  }

  const extractBulletsFromText = (text) => {
    if (!text || typeof text !== 'string') {
      return []
    }

    const bullets = []

    // Handles collapsed text like:
    // "* **Description:** ... * **sizes available:** ..."
    const boldFieldRegex = /\*\s+\*\*([^*]+)\*\*:\s*([\s\S]*?)(?=\s+\*\s+\*\*[^*]+\*\*:|$)/g
    for (const match of text.matchAll(boldFieldRegex)) {
      const label = match[1]?.trim()
      const value = match[2]?.trim()
      if (label && value) {
        bullets.push(`${label}: ${value}`)
      }
    }

    if (bullets.length > 0) {
      return bullets
    }

    // Fallback for non-bold bullets in collapsed form.
    const plainFieldRegex = /\*\s+([^:*\n][^:\n]*):\s*([\s\S]*?)(?=\s+\*\s+[^:*\n][^:\n]*:\s*|$)/g
    for (const match of text.matchAll(plainFieldRegex)) {
      const label = match[1]?.trim()
      const value = match[2]?.trim()
      if (label && value) {
        bullets.push(`${label}: ${value}`)
      }
    }

    return bullets
  }

  const listItems = []
  collectListItems(children, listItems)

  if (listItems.length > 0) {
    for (const item of listItems) {
      const normalized = normalizeBulletLine(item)
      if (normalized) {
        bulletLines.push(normalized)
      }
    }
  } else {
    const childText = extractText(children)
    const collapsedBullets = extractBulletsFromText(childText)

    if (collapsedBullets.length > 0) {
      bulletLines.push(...collapsedBullets)
    } else {
      const lines = childText.split('\n')
      for (const line of lines) {
        const normalized = normalizeBulletLine(line)
        if (normalized) {
          bulletLines.push(normalized)
        }
      }
    }
  }

  return (
    <ClothingCard
      name={brand ? `${name} (${brand})` : name}
      bulletLines={bulletLines}
    />
  )
}

/**
 * MdxCardCarousel
 * Wraps ClothingCarousel for MDX rendering.
 * Counts <product-card> children and renders them.
 */
function MdxCardCarousel({ children }) {
  const cards = Array.isArray(children)
    ? children.filter((c) => c)
    : children
    ? [children]
    : []

  return (
    <ClothingCarousel itemCount={cards.length}>
      {cards}
    </ClothingCarousel>
  )
}

function MdxProductDetails({ children }) {
  return <>{children}</>
}

/**
 * MDX component schemas for validation
 */
const mdxComponents = {
  'product-card': mdxComponent(
    MdxProductCard,
    z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string().optional(),
      children: z.any(),
    })
  ),
  'card-carousel': mdxComponent(
    MdxCardCarousel,
    z.object({
      children: z.any(),
    })
  ),
  'product-details': mdxComponent(
    MdxProductDetails,
    z.object({
      children: z.any(),
    })
  ),
}

const mdMarkdownComponents = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  p: ({ children }) => <p className="clothing-renderer__prose-text">{children}</p>,
  ul: ({ children }) => <ul className="clothing-renderer__prose-list">{children}</ul>,
  ol: ({ children }) => <ol className="clothing-renderer__prose-list">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h2: ({ children }) => <h2 className="clothing-renderer__prose-heading">{children}</h2>,
  h3: ({ children }) => <h3 className="clothing-renderer__prose-subheading">{children}</h3>,
}

/**
 * ClothingRenderer
 *
 * Renders MDX output from the agent. Supports:
 *  - <card-carousel> with nested <product-card> components
 *  - Preamble and postamble text rendered as plain markdown
 */
export function ClothingRenderer({ markdown }) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false)

  if (!markdown || typeof markdown !== 'string') {
    return null
  }

  return (
    <div className="clothing-renderer">
      <div className="clothing-renderer__toolbar">
        <button
          type="button"
          className="clothing-renderer__toggle-btn"
          onClick={() => setShowRawMarkdown((current) => !current)}
        >
          {showRawMarkdown ? 'View formatted cards' : 'View raw markdown'}
        </button>
      </div>

      {showRawMarkdown ? (
        <pre className="clothing-renderer__raw-markdown">{markdown}</pre>
      ) : (
        <MdxReactMarkdown
          components={mdxComponents}
          markdownComponents={mdMarkdownComponents}
        >
          {markdown}
        </MdxReactMarkdown>
      )}
    </div>
  )
}

