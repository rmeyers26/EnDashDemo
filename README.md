# Lensfolio

A photography hobby site built to show off [EmDash CMS](https://docs.emdashcms.com/) working behind the scenes. It publishes photos, press releases, videos and a journal, all edited in the EmDash admin dashboard and served by [Astro](https://astro.build) on Cloudflare Workers.

## What's on the site

| Collection | Public pages | What it holds |
|---|---|---|
| Photos | `/photos`, `/photos/:slug` | Image, caption, location, camera, lens, date, genre, story |
| Press Releases | `/press`, `/press/:slug` | Headline, dateline, summary, body, headline image, optional PDF press kit |
| Videos | `/videos`, `/videos/:slug` | Title, description, MP4/WebM file, poster image |
| Journal | `/posts`, `/posts/:slug` | Blog posts with categories, tags and bylines |
| Pages | `/pages/:slug` | Static pages such as About |

Also: `/how-it-works` (a tour of what the CMS is doing), `/search`, `/rss.xml`, and light/dark mode.

## How it fits together

```
 Editor ──► /_emdash/admin ──► EmDash ──► D1 database  (entries, settings, users)
                                  │
                                  └────► R2 bucket     (uploaded images, videos, PDFs)
                                  ▲
 Visitor ──► Astro page ──► getEmDashCollection("photos")
```

Pages are rendered on the server for every request, so a change published in the admin appears on the next page load. Nothing is rebuilt.

## Project layout

| Path | Purpose |
|---|---|
| `seed/seed.json` | Starting content model: collections, fields, taxonomies, menu, sample entries |
| `astro.config.mjs` | Astro + EmDash setup: D1 database, R2 storage, upload size limit |
| `wrangler.jsonc` | Cloudflare bindings (D1 `DB`, R2 `MEDIA`) |
| `src/pages/` | Public pages; each folder matches a collection |
| `src/components/MediaCard.astro` | Card shared by photos, press and videos |
| `src/styles/collections.css` | Shared layout for those pages |
| `src/styles/theme.css` | Where to restyle the site (design tokens) |
| `src/utils/media-url.ts` | Turns a stored file field into a URL |
| `emdash-env.d.ts` | Generated types for the collections (regenerated when the dev server starts) |

## Run it locally

You need Node.js 22.16 or later.

```bash
npm install
npm run dev
```

1. Open http://localhost:4321/_emdash/admin.
2. In the setup wizard, enter a site title and your email, and **leave "Include sample content" ticked**.
3. Register a passkey (a login stored on your device), then open the dashboard.
4. Visit http://localhost:4321 to see the site.

The local database and uploads live in `.wrangler/` and are ignored by Git. Delete that folder to start over.

### Sample images

The sample photos are placeholders downloaded from `picsum.photos` during setup. If your network blocks that site, the entries are still created but have no image. Upload your own in **Media**, then attach them to each photo.

## Deploy to Cloudflare

Create the R2 media bucket once, then deploy:

```bash
npx wrangler login
npx wrangler r2 bucket create my-emdash-media   # must match bucket_name in wrangler.jsonc
npm run deploy
```

The first deploy creates the D1 database and KV session namespace automatically, but **not** the R2 bucket. Without it the deploy fails with `R2 bucket 'my-emdash-media' not found`. (In the Cloudflare dashboard: R2 Object Storage, Create bucket, same name. R2 may ask you to enable it on your account first.) If you deploy through Workers Builds (connected Git repo), create the bucket first and then retry the build. Then open `https://<your-worker>.workers.dev/_emdash/admin` and run the setup wizard there. See [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/) for details, including custom domains.

Before going live:
- Back up `EMDASH_ENCRYPTION_KEY` (create one with `npx emdash secrets generate`). Never commit `.env`.
- Comments are on for Journal posts. Set up moderation in the admin, or turn them off.
- Run `npx emdash doctor` to check the setup.

## Uploads and video

- The Media Library accepts images, MP4/WebM/QuickTime video, audio and PDFs.
- The upload limit is set to 90 MB in `astro.config.mjs` (`maxUploadSize`). EmDash's default is 50 MB.
- Uploads go through the Worker, so Cloudflare's request-size cap applies (about 100 MB on Free and Pro plans). For longer videos, add the Cloudflare Stream media provider (`cloudflareStream()` from `@emdash-cms/cloudflare`).

## Common mistakes

- **Changed `seed.json` but nothing happened.** The seed only runs on an empty database. Delete `.wrangler/` locally, or change the model in the admin under **Content Types**.
- **A new collection has no types.** Restart `npm run dev`, which regenerates `emdash-env.d.ts`.
- **Published entry doesn't show.** Check it is *published*, not saved as a draft.
- **`Image` shows nothing.** Image fields are objects, not strings. Render them with `<Image image={...} />` from `emdash/ui`.

## Useful commands

```bash
npm run dev         # local dev server
npm run typecheck   # astro check
npm run build       # production build
npm run deploy      # build and deploy to Cloudflare
npx emdash content list photos   # list entries from the command line
```

## Ideas for later

Search filters by genre, a contact form plugin, scheduled publishing for press releases, Cloudflare Stream for long videos, and a custom domain.
