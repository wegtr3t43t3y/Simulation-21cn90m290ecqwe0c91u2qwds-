# LabVerse 3D Simulator

A browser-based lab simulation experience with:

- a 3D-inspired scientific workbench environment
- interactive control sliders for temperature, agitation, and catalyst level
- multiple reaction presets such as synthesis, crystallization, combustion, and catalytic flow
- animated chemical reaction particles rendered in a live canvas
- floating lab tools and a futuristic facility look

## Run locally

Option 1: open `index.html` directly in a browser.

Option 2: from the project directory, run a tiny local server:

```bash
cd /path/to/project
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Files

- `index.html` — app structure
- `styles.css` — 3D lab styling and effects
- `app.js` — control logic and reaction animation

## Notes

This project is intentionally dependency-free so it works immediately in static hosting environments or local browser testing.
