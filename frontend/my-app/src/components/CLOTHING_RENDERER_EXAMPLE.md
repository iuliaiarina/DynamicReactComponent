# ClothingRenderer - MDX Output Example

The agent should now generate output in **MDX format** (JSX embedded in Markdown) that the `ClothingRenderer` component can parse and display with interactive product cards.

## Expected Agent Output Format

```mdx
Here are some pink dress options I found:

<card-carousel>
  <product-card id="asos-001" name="Ruffle Column Cami Maxi Dress" brand="ASOS DESIGN">
    <product-details>
    * **Description:** Elegant maxi dress featuring a delicate ruffle column design with thin cami straps. Lightweight and flowing silhouette perfect for formal events or evening wear.
    * **sizes available:** XS, S, M, L, XL, XXL
    * **Regular price:** $89.00
    * **Discounted price:** $62.99
    * **style:** formal, party, wedding guest
    * **length:** maxi
    * **material:** 100% polyester
    * **color:** hot pink
    * **link to the product page:** https://www.asos.com/us/asos-design/asos-design-ruffle-column-cami-maxi-dress-in-pink/prd/210372357
    </product-details>
  </product-card>

  <product-card id="asos-002" name="Lace Mix Asymmetric Hem Dress" brand="ASOS DESIGN">
    <product-details>
    * **Description:** Modern asymmetric design with lace detailing and a flattering hanky-slash neckline.
    * **sizes available:** XS, S, M, L, XL
    * **Regular price:** $75.00
    * **Discounted price:** N/A
    * **style:** cocktail, party
    * **length:** knee-length
    * **material:** lace blend
    * **color:** blush pink
    * **link to the product page:** https://www.asos.com/asos-design/asos-design-lace-mix-asymmetric-hem-hanky-slash-neck-dress-in-pink/prd/208502224
    </product-details>
  </product-card>
</card-carousel>

## Sources

- https://www.asos.com/...
- https://www.nordstrom.com/...
```

## Key Features

### MDX Component Structure
- **`<card-carousel>`** — Wraps all product cards; displays them in a horizontal scrollable carousel with navigation buttons
- **`<product-card>`** — Each product item with attributes:
  - `id`: Unique identifier (used internally)
  - `name`: Product name
  - `brand`: Brand or store name
  - `children`: Contains `<product-details>` element

### Product Details
Inside each `<product-card>`, use `<product-details>` with bullet points in this format:
```
* **Field Name:** value
```

**Required fields** (in order):
1. Description
2. sizes available
3. Regular price
4. Discounted price (use "N/A" if no discount)
5. style
6. length
7. material
8. color
9. link to the product page

### Optional Content
- **Preamble** (before `<card-carousel>`): Any introductory text
- **Postamble** (after carousel): Sources section or additional notes

## Why MDX?

By using MDX components instead of plain markdown:
- ✅ LLM generates simple JSX tags with minimal attributes
- ✅ Field data is kept in text form (no complex object hallucinations)
- ✅ Component structure is self-validating with Zod schemas
- ✅ React components handle rendering logic, not the LLM
- ✅ Easy to extend with new custom components

## React Component Architecture

```
ClothingRenderer (parses MDX)
├── MdxReactMarkdown (renders MDX + markdown)
│   ├── <card-carousel> (MdxCardCarousel)
│   │   └── <product-card> (MdxProductCard) [×N]
│   │       └── ClothingCard (display component)
│   │           └── ClothingCarousel (carousel UI)
│   └── Preamble/Postamble (standard markdown)
```

Each component has a corresponding `.css` file for styling.
