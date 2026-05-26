import ReactMarkdown from 'react-markdown'
import { withMdx, mdxComponent } from 'react-markdown-with-mdx'
import { z } from 'zod'
import { useState, Children, isValidElement } from 'react'
import { ClothingCard } from '../assets/ClothingCard'
import { ClothingCarousel } from '../assets/ClothingCarousel'
import './ClothingRenderer.css'

const MarkdownWithMdx = withMdx(ReactMarkdown)

function MdxProductCard({ name, brand, image, link, children }) {
  const bulletList = Children.toArray(children)

  return (
    <ClothingCard  name={name} brand={brand} image={image} link={link}>
        {bulletList}
    </ClothingCard>

  )
}

function MdxCardCarousel({ children }) {
  const carouselItems = Children.toArray(children)
  return (
    <ClothingCarousel itemCount={carouselItems.length}>
      {carouselItems}
    </ClothingCarousel>
  )
}

const components = {
  'card-carousel': mdxComponent(
    MdxCardCarousel,
    z.object({
      children: z.any(),
    })
  ),
  'product-card': mdxComponent(
    MdxProductCard,
    z.object({
      name: z.string(),
      brand: z.string().optional(),
      image: z.string().optional(),
      link: z.string().optional(),
      children: z.any(),
    })
  )
}



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
        <MarkdownWithMdx
          components={components}
        >
          {markdown}
        </MarkdownWithMdx>
      )}
    </div>
  )
}

