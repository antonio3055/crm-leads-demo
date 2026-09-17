# crm-leads-demo

Standalone mock CRM leads prototype — a single page (`index.html`) with plain
HTML/CSS/JS, no framework, no build step, no backend.

Everything is mock data generated client-side (`js/data.js`) — 50 synthetic
leads, no real customer data. Phone numbers use the NANP-reserved
`555-01xx` block, which can never route to a real subscriber.

## Structure

- `index.html` — page shell
- `css/` — `shell`, `list`, `detail`, `tabs`, `modals`
- `js/` — `icons`, `data`, `list`, `detail`, `tabs`, `modals`, `app` (wiring)

## Run it

Open `index.html` directly in a browser, or serve the folder with any static
file server.
