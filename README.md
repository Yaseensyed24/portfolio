# Yasin — A life in the making

Personal journal, photographs, California route, books, sports, and a 12-question beef quiz.

## Hosting

- Website: https://syedyasin.com/
- GitHub Pages publishes the main branch from the repository root.
- Squarespace manages the domain. Keep CNAME set to syedyasin.com.
- .nojekyll serves these authored HTML, CSS, JavaScript, and local assets directly.

## Shared votes and anonymous notes

GitHub Pages serves the frontend. The existing Cloudflare Worker/D1 backend remains at https://yasin-life-in-the-making.glassybunting2.chatgpt.site.
The api-origin meta tag in index.html connects /api/beef and /api/feedback to that public backend.
Only the published website origins receive cross-origin browser access. No API credentials are included in this repository.
Votes use a separate random receipt per question; changing an answer updates its vote. Notes need no account, name, or email.

## Editing

Edit index.html, styles.css, app.js, journal-additions.*, beef-quiz.*, or the files under assets/.
Keep the api-origin meta tag unless the backend is intentionally moved. The backend and its database are deployed separately.
Gallery uploads currently stay on the uploading device; add public photos under assets/ and update the gallery to publish them.
Image attributions are in assets/asset-sources.json and the page captions.

The previous website is preserved on the archive/pre-journal-2026-11-18 branch.
