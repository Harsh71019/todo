# Home Server Deployment Guide

Local Proxmox setup — apps running in Docker inside an LXC container.

---

## Infrastructure

| Component | Detail |
|-----------|--------|
| Host | Proxmox VE (home server) |
| App container | LXC at `192.168.0.226` |
| SSH access | `ssh root@192.168.0.226` (passwordless key auth) |
| App root | `/opt/apps/<appname>/` |
| Docker | Installed directly in the LXC container |

Each app is two Docker containers (Express API + nginx SPA) on an isolated bridge network. MongoDB is hosted on Atlas — no local database.

---

## Deployed Apps

| App | Repo | Local URL | Port |
|-----|------|-----------|------|
| Taskflow (Todo) | github.com/Harsh71019/todo | http://192.168.0.226:3000 | 3000 |
| JS Mastery | github.com/Harsh71019/js-mastery | http://192.168.0.226:3001 | 3001 |

---

## Architecture (per app)

```
Browser → nginx:80 (exposed as host port)
              ├── /api/*  → proxy → Express:PORT (internal only)
              └── /*      → serve built React SPA
```

Each app has two containers on a private Docker network:

- **client** — nginx serving the Vite-built static files, proxying `/api` to the server container
- **server** — Express + TypeScript, connected to MongoDB Atlas, never exposed directly to the host

---

## App 1: Taskflow (Todo)

**Path on server:** `/opt/apps/todo/`
**URL:** http://192.168.0.226:3000

### `.env` (at `/opt/apps/todo/.env`)

```
PORT=5001
MONGODB_URI=mongodb+srv://...@mern-cluster.vawf1hp.mongodb.net/todo-app...
JWT_SECRET=...
BETTER_AUTH_API_KEY=...
CLIENT_URL=http://192.168.0.226:3000
COOKIE_SECURE=false
```

> `COOKIE_SECURE=false` is required because the app runs over plain HTTP.
> Without it, the JWT cookie is set with the `Secure` flag and browsers silently
> drop it on HTTP, breaking all authenticated requests after login.

### Update

```bash
ssh root@192.168.0.226 "cd /opt/apps/todo && bash deploy.sh"
```

---

## App 2: JS Mastery

**Path on server:** `/opt/apps/js-mastery/`
**URL:** http://192.168.0.226:3001

### `.env` (at `/opt/apps/js-mastery/.env`)

```
PORT=3001
MONGODB_URI=mongodb+srv://...@mern-cluster.vawf1hp.mongodb.net/dsa-app...
ALLOWED_ORIGINS=http://192.168.0.226:3001
```

### Update

```bash
ssh root@192.168.0.226 "cd /opt/apps/js-mastery && bash deploy.sh"
```

---

## What `deploy.sh` Does

Both apps have an identical `deploy.sh` at the repo root:

```bash
git pull                                        # pull latest from main
docker compose --env-file .env up -d --build   # rebuild changed images, restart
docker image prune -f                          # clean up dangling images
curl http://localhost:<port>/api/health        # confirm app is up
```

---

## Useful Commands

### Check running containers

```bash
ssh root@192.168.0.226 "docker ps"
```

### View live logs

```bash
# Taskflow server logs
ssh root@192.168.0.226 "docker logs -f todo-server-1"

# JS Mastery server logs
ssh root@192.168.0.226 "docker logs -f js-mastery-server-1"
```

### Check health endpoints

```bash
curl http://192.168.0.226:3000/api/health   # Taskflow
curl http://192.168.0.226:3001/api/health   # JS Mastery
```

### Restart without rebuilding

```bash
ssh root@192.168.0.226 "docker compose -f /opt/apps/todo/docker-compose.yml restart"
ssh root@192.168.0.226 "docker compose -f /opt/apps/js-mastery/docker-compose.yml restart"
```

### Stop an app

```bash
ssh root@192.168.0.226 "docker compose -f /opt/apps/todo/docker-compose.yml down"
```

### SSH into a running container

```bash
ssh root@192.168.0.226 "docker exec -it todo-server-1 sh"
```

### Inspect env vars in a running container

```bash
ssh root@192.168.0.226 "docker exec todo-server-1 env"
```

### Free up disk space

```bash
ssh root@192.168.0.226 "docker image prune -a -f"
```

---

## Adding a New App

1. Add `server/Dockerfile`, `client/Dockerfile`, `client/nginx.conf` to the repo
2. Add `docker-compose.yml` at repo root — pick an unused port
3. Add `deploy.sh` at repo root
4. On the server:

```bash
# Clone
ssh root@192.168.0.226 "git clone https://github.com/Harsh71019/<repo>.git /opt/apps/<name>"

# Write .env
ssh root@192.168.0.226 "cat > /opt/apps/<name>/.env << 'EOF'
KEY=value
EOF
chmod 600 /opt/apps/<name>/.env"

# First deploy
ssh root@192.168.0.226 "chmod +x /opt/apps/<name>/deploy.sh && cd /opt/apps/<name> && bash deploy.sh"
```

---

## Notes

- `.env` files live only on the server — never committed to git
- `COOKIE_SECURE=false` must be set for any app using `httpOnly` cookies over plain HTTP. If you add HTTPS later (Caddy, Nginx, etc.), flip it to `true`
- All containers auto-restart on reboot (`restart: unless-stopped`)
