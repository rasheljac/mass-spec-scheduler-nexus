## Problem

The current `docker-compose.yml` has duplicate/conflicting host port mappings, which is what EasyPanel is complaining about:

- `lab-management` publishes `8080:80`
- `traefik` publishes `80:80`, `443:443`, **and `8080:8080`** (dashboard) — same host port `8080` as the app
- On EasyPanel, ports `80`, `443`, and `8080` are almost always already taken by EasyPanel's own reverse proxy

EasyPanel handles routing/SSL itself, so the container does not need to publish to common host ports at all — it just needs to expose its internal port so EasyPanel can proxy to it.

## Fix

Randomize all host-side ports to high, unlikely-to-collide numbers, and remove the bundled Traefik service (EasyPanel replaces it). The container's internal port stays `80` (nginx) so EasyPanel's proxy can reach it.

Chosen random high ports (in the 39000–49000 ephemeral-ish range, avoiding common defaults):

| Service | Old host port | New host port | Container port |
|---|---|---|---|
| lab-management (app) | 8080 | **41783** | 80 |
| traefik http | 80 | removed | — |
| traefik https | 443 | removed | — |
| traefik dashboard | 8080 | removed | — |

The Vite dev server port (`8080` in `vite.config.ts`) is local-dev only and does not affect EasyPanel deployment, but I'll bump it to **41784** for consistency so it never clashes with the container port either.

## Files to change

1. **`docker-compose.yml`**
   - Change `lab-management` ports from `"8080:80"` to `"41783:80"`
   - Remove the entire `traefik` service block and the `letsencrypt` volume (EasyPanel provides its own reverse proxy + SSL; keeping Traefik is what's causing the duplicate `8080` binding)
   - Keep the Traefik/EasyPanel/CapRover labels on `lab-management` so other platforms still work

2. **`docker-compose.prod.yml`** — no port changes needed (it only overrides env/replicas), leave as is.

3. **`Dockerfile`** — keep `EXPOSE 80` and nginx listening on 80 internally. EasyPanel routes to the container's internal port, so this stays untouched.

4. **`nginx.conf`** — keep `listen 80;` (internal only, no host conflict).

5. **`vite.config.ts`** — change dev `server.port` from `8080` to `41784` (cosmetic / future-proofing for local dev only).

6. **`scripts/deploy.sh`** — update the printed local URL from `http://localhost:8080` to `http://localhost:41783`.

7. **`DEPLOYMENT.md`** — update the Quick Start URL reference from `8080` to `41783` so the docs match.

## EasyPanel side (what you do after redeploy)

In your EasyPanel service settings, set the **Proxy → Container Port** to `80` (the internal nginx port). Do **not** add a host port mapping there — EasyPanel handles 80/443 termination on the host and forwards to the container's internal port. With Traefik removed and the host port randomized to `41783`, there will be no more duplicate-port error.

## Summary

Removes the bundled Traefik (the actual source of the duplicate `8080`), randomizes the app's host port to `41783`, bumps the local Vite dev port to `41784`, and updates the deploy script + docs to match.
