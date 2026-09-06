# Admin panel media storage

Admin uploads go to **dedicated private GCS buckets** — not core seller media
(`palette-media-stage` / `palette-media-prod`), and **not** publicly readable.

## Branch → environment → bucket

| Git branch | Deploy target | `GCS_BUCKET_NAME` |
|------------|---------------|-------------------|
| `develop` | Staging | `palette-admin-media-stage` |
| `main` | Production | `palette-admin-media-prod` |

Same SA: `admin-media-storage@palette-cdn.iam.gserviceaccount.com`  
Mount key as K8s secret → `GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcs/key.json`  
(Do **not** commit `palette-cdn-*.json`.)

## Providers

| `STORAGE_PROVIDER` | Backend | When |
|--------------------|---------|------|
| `gcs` | Private GCS + `GET /files/*` JWT proxy | Staging / production (primary) |
| `static` | SeaweedFS filer | Local legacy / emergency only |

No auto-fallback — set the provider explicitly.

## Endpoints

- `POST /upload` (JWT) → `{ path, url, contentType, provider }`
- `POST /admins/avatar` (JWT) → stores **relative `path`** on the admin row
- `GET /files/*` (JWT) → streams object bytes (private buckets; never public GCS URLs)

## Frontend

- `VITE_API_URL` — admin API (also used to build `/files/...` URLs)
- `VITE_STATIC_FILES_BASE_URL` — **core** static-server for seller ticket attachments only
- Avatars use `useAuthenticatedFileSrc` so JWT is sent when loading private files
