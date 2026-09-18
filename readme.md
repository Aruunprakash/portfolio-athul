# Architectural & 3D Visualization Portfolio | Athul P

A responsive, high-performance web portfolio created for **Athul P** — Junior Architect & 3D Visualizer based in Kozhikode, Kerala, India. This showcase highlights 2D CAD working drawings, municipal approval sheets, interior design packages, electrical/plumbing layouts, and photorealistic 3D exterior renderings.

---

## 📸 Portfolio Highlights & Project Sections

The portfolio is structured into **06 main project packages**:

1. **01 — Proposed Residential House Working Drawings Sheet**: Comprehensive municipal architectural package detailing Front Elevation, Cross Section AA, and Floor Plans (Panniyankara, Calicut).
2. **02 — Sections & Elevations Detail Sheet**: Longitudinal Cross-Section AA with vertical clearances, staircase geometry, and detailed side elevation views.
3. **03 — Interior Design & 3D Visualization (Master Bedroom Package)**: 2D CAD interior layout (406 × 351 CM) paired with high-resolution 3D interior renders featuring backlit vanity consoles and custom wardrobes.
4. **04 — Ground & First Floor Plan (Electrical Layout)**: Complete electrical working drawing showing switchboard locations, ceiling fan fixtures, AC points, tube lights, and distribution board legends.
5. **05 — Master Bedroom Toilet & Vanity Plumbing Details**: Detailed 2D CAD plumbing drawings showcasing 4-wall interior views, toilet floor layout (240 × 150 CM), shower height specifications, and washbasin vanity elevations.
6. **06 — Photorealistic Exterior Architectural Renders**: Full-bleed 3D visualization rendered with Autodesk 3ds Max and V-Ray featuring natural daylight simulations, texturing, and environment integration.

---

## ✨ Features & Functionality

* **Light/Dark Mode Theme Toggle**: Defaults to clean Light Mode (`data-theme="light"`) with single-click persistence saved to `localStorage`.
* **HD Drawing Lightbox Modal**: Click-to-inspect modal for high-resolution CAD sheets featuring:
  * Dynamic zoom controls ($0.5\times$ to $4.0\times$).
  * Click-and-drag panning capability when zoomed.
  * Keyboard navigation (`Escape` key close).
* **Interactive Overlays**: Semi-transparent dark inspect buttons placed at the bottom-right corner of all image cards with smooth glassmorphism effects and clean hover transitions.
* **Curriculum Vitae Viewer**: Embedded PDF modal preview and direct PDF download link.
* **Direct Mail Integration**: Pre-formatted contact form that initializes the user's native email client via `mailto:`.
* **Fully Responsive Design**: Fluid layout engineered with standard CSS Grid & Flexbox, optimized for all viewport sizes (Desktop, Tablet, Mobile).

---

## 🛠️ Tech Stack & Dependencies

* **Frontend Structure**: HTML5 (Semantic markup)
* **Styling**: Vanilla CSS3 (CSS Custom Variables, CSS Grid, Flexbox, Glassmorphism effects)
* **Interactivity**: Native JavaScript (ES6+)
* **Typography**: Google Fonts (*Space Grotesk*, *Outfit*, *JetBrains Mono*)
* **Icons**: FontAwesome 6.5.1 (via CDN)

---

## 📁 Project Structure

```text
.
├── index.html                  # Main portfolio single-page application
├── style.css                   # Global styles, CSS variables, and media queries
├── script.js                  # Lightbox, modal, theme toggle, and interaction scripts
├── README.md                   # Project documentation
└── assets/                     # Project image assets and documents
    ├── athul_cv.pdf            # PDF Curriculum Vitae
    ├── sketch.jpg              # Hero cover freehand sketch
    ├── building_plan_overview.png # 01 Working drawing overview sheet
    ├── section_aa.png          # 02 Section AA CAD drawing
    ├── elevation_north.png     # 02 North elevation drawing
    ├── elevation_south.png     # 02 South elevation drawing
    ├── bedroom_plan.png        # 03 Master bedroom 2D plan
    ├── bedroom_render_1.jpg    # 03 Master bedroom 3D render 1
    ├── bedroom_render_2.jpg    # 03 Master bedroom 3D render 2
    ├── bedroom_render_3.jpg    # 03 Master bedroom 3D render 3
    ├── bedroom_render_4.jpg    # 03 Master bedroom 3D render 4
    ├── electrical_drawing_uploaded.jpg # 04 Electrical layout sheet
    ├── PHOTO-plum1.jpg  # 05 Washbasin vanity plan & elevation
    ├── PHOTO-plum2.jpg  # 05 Master bedroom toilet plumbing sheet
    └── exterior_render_full.jpg # 06 3ds Max + V-Ray exterior render
