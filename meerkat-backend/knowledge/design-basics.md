# Design & Digital Design Fundamentals

## Core Design Principles

### Visual Hierarchy
The arrangement of elements to show their order of importance. Achieved through:
- Size: Larger elements draw more attention
- Color: Bold or contrasting colors stand out
- Contrast: Difference between elements creates focus
- Alignment: Organized layouts guide the eye
- Proximity: Related items grouped together

### Balance
Distribution of visual weight in a design:
- Symmetrical: Mirror image on both sides, formal and stable
- Asymmetrical: Different elements balanced by visual weight, dynamic and interesting
- Radial: Elements arranged around a central point

### Contrast
The difference between elements that makes them distinguishable:
- Light vs dark
- Large vs small
- Thick vs thin
- Rough vs smooth
- Color opposites (complementary colors)

### Repetition
Consistent use of design elements to create unity:
- Repeating colors, fonts, shapes, or patterns
- Creates rhythm and cohesion
- Strengthens brand identity

### White Space (Negative Space)
Empty space around and between elements:
- Improves readability and comprehension
- Creates breathing room
- Draws attention to important elements
- Makes designs feel premium and clean

## Color Theory

### Color Wheel
- Primary colors: Red, Yellow, Blue
- Secondary colors: Orange, Green, Purple (mixing primaries)
- Tertiary colors: Mix of primary and secondary

### Color Harmonies
- Complementary: Opposite colors on wheel (high contrast)
- Analogous: Adjacent colors (harmonious)
- Triadic: Three evenly spaced colors (vibrant)
- Split-complementary: Base color + two adjacent to complement
- Monochromatic: One color in different shades/tints

### Color Psychology
- Red: Energy, passion, urgency
- Blue: Trust, calm, professionalism
- Green: Nature, growth, health
- Yellow: Optimism, warmth, attention
- Purple: Luxury, creativity, wisdom
- Orange: Enthusiasm, creativity, affordability
- Black: Elegance, power, sophistication
- White: Purity, simplicity, cleanliness

## Typography

### Font Categories
- Serif: Traditional, trustworthy (Times, Georgia)
- Sans-serif: Modern, clean (Helvetica, Arial)
- Display: Decorative, attention-grabbing
- Script: Elegant, personal
- Monospace: Technical, code-like

### Typography Terms
- Kerning: Space between individual characters
- Tracking: Space between all characters in text
- Leading: Space between lines of text
- Hierarchy: Using size/weight to show importance
- Font pairing: Combining complementary fonts

### Best Practices
- Limit to 2-3 fonts per design
- Ensure readability at all sizes
- Consider line length (45-75 characters ideal)
- Use proper contrast with background

## Digital Design Specifics

### Resolution
- Print: 300 DPI (dots per inch)
- Web/Screen: 72 PPI (pixels per inch)
- Retina displays: 2x or 3x standard resolution

### File Formats
- JPEG: Photos, complex images (lossy compression)
- PNG: Transparency, sharp edges (lossless)
- SVG: Vector graphics, scalable, web icons
- GIF: Simple animations, limited colors
- WebP: Modern web format, good compression
- PDF: Print-ready, preserves layout

### Responsive Design
- Fluid grids: Percentage-based layouts
- Flexible images: Scale with container
- Media queries: CSS rules for different screens
- Mobile-first: Design for small screens first
- Breakpoints: Points where layout changes

## UI/UX Design

### User Interface (UI)
- Visual design of interfaces
- Buttons, icons, spacing, colors
- Typography and imagery
- Interactive elements

### User Experience (UX)
- Overall experience using a product
- User research and personas
- Information architecture
- Wireframing and prototyping
- Usability testing

### Common UI Patterns
- Navigation: Hamburger menu, tabs, breadcrumbs
- Forms: Input fields, validation, progress indicators
- Cards: Content containers with image, text, actions
- Modals: Overlay dialogs for focused tasks
- Toast notifications: Brief feedback messages

## Design Tools

### Vector Design
- Adobe Illustrator: Industry standard
- Figma: Collaborative, web-based
- Sketch: Mac-only, UI focused
- Inkscape: Free, open source

### Raster/Photo Editing
- Adobe Photoshop: Industry standard
- GIMP: Free, open source
- Affinity Photo: One-time purchase
- Pixlr: Web-based, free

### UI/UX Design
- Figma: Collaborative design and prototyping
- Adobe XD: Prototyping and design systems
- Sketch: UI design for Mac
- InVision: Prototyping and collaboration

### Motion Design
- After Effects: Industry standard
- Lottie: Lightweight animations for web
- Rive: Interactive animations
- CSS animations: Web-native motion

## Pixel Art

### Fundamentals
- Art created at the pixel level on a small grid (16x16, 32x32, 64x64)
- Limited color palettes: often 8-32 colors for cohesion
- Every pixel is a deliberate design choice
- Canvas sizes: 16x16 (icons), 32x32 (characters), 64x64+ (scenes)
- Resolution independent of display size (scaled up with nearest-neighbor)

### Techniques
- **Dithering**: simulate colors and shading by alternating pixel patterns
- **Anti-aliasing**: manually place intermediate color pixels to smooth edges
- **Sub-pixel rendering**: suggest detail finer than one pixel
- **Color ramps**: planned gradients from dark to light in limited palette
- **Outline styles**: full outline, selective outline, or no outline

### Tools for Pixel Art
- Aseprite: industry standard for pixel art and animation
- Piskel: free, web-based pixel art editor
- GraphicsGale: lightweight pixel animation tool
- Photoshop: works with proper settings (nearest-neighbor scaling, pixel grid)
- Lospec: palette database and pixel art resources

## Digital Art Styles

### Popular Styles
- **Vaporwave**: pastel colors, retro tech aesthetic, glitch art, 80s/90s nostalgia
- **Cyberpunk**: neon colors, dark backgrounds, futuristic urban themes
- **Isometric**: 3D-like perspective on a 2D plane, popular for game art
- **Flat design**: minimal, clean, no shadows or gradients
- **Low poly**: 3D models with visible geometric faces

### NFT Art Considerations
- **Collection traits**: design modular layers that combine (body, head, accessories)
- **Rarity tiers**: plan which traits are common, rare, and legendary
- **Visual cohesion**: all variations should feel like part of the same collection
- **File format**: PNG for static, GIF/MP4 for animated, SVG for on-chain
- **Resolution**: balance quality with file size (IPFS storage costs)

### Generative Art
- Algorithm-driven art creation with controlled randomness
- Tools: p5.js, Processing, three.js, Cairo
- Parameters define the possibility space
- Each output is unique but recognizably from the same system
- Art Blocks, fxhash: platforms for on-chain generative art

### Motion Graphics Basics
- Frame-by-frame animation vs tweened animation
- Easing curves: ease-in, ease-out, bounce, elastic
- Principles of animation: squash and stretch, anticipation, follow-through
- Export formats: GIF (simple), MP4/WebM (complex), Lottie JSON (web)
- Keep file sizes reasonable for on-chain and web display
