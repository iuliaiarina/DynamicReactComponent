import { useRef, useState } from 'react'
import './ClothingCarousel.css'

export function ClothingCarousel({ children, itemCount }) {
  const trackRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollTo = (index) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[index]
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    setActiveIndex(index)
  }

  const scrollBy = (dir) => {
    const next = Math.max(0, Math.min(itemCount - 1, activeIndex + dir))
    scrollTo(next)
  }

  return (
    <div className="carousel">
      <div className="carousel__header">
        <span className="carousel__count">{itemCount} item{itemCount !== 1 ? 's' : ''} found</span>
        <div className="carousel__nav">
          <button
            className="carousel__nav-btn"
            onClick={() => scrollBy(-1)}
            disabled={activeIndex === 0}
            aria-label="Previous item"
          >
            ‹
          </button>
          <button
            className="carousel__nav-btn"
            onClick={() => scrollBy(1)}
            disabled={activeIndex >= itemCount - 1}
            aria-label="Next item"
          >
            ›
          </button>
        </div>
      </div>

      <div className="carousel__track" ref={trackRef}>
        {children}
      </div>

      {itemCount > 1 && (
        <div className="carousel__dots">
          {Array.from({ length: itemCount }, (_, i) => (
            <button
              key={i}
              className={`carousel__dot${i === activeIndex ? ' carousel__dot--active' : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`Go to item ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
