# Smart OMR — Production Deployment Guide

Smart OMR is engineered with a **single-service production architecture**. In production, FastAPI simultaneously serves:
1. The REST API (`/api/...`)
2. The interactive Swagger documentation (`/docs`)
3. The uploaded and annotated image storage (`/uploads/...`)
4. The printable OMR templates (`/omr_templates/...`)
5. The compiled high-performance React 18 Single Page Application (`/`)

This means you only need to host **one unified container or process** on a single port!

---

## Option 1: One-Command Docker Deployment (Recommended)

Smart OMR includes a production multi-stage `Dockerfile` and `docker-compose.yml`.

### Deploy Locally or on Any Linux Server:
```bash
# Clone or navigate to the project directory
cd smart-omr

# Build and start the container in detached mode
docker compose up -d --build
```

- Web UI & API will be immediately available at: `http://<your-server-ip>:8000`
- Check health status: `curl http://localhost:8000/api/health`
- Container logs: `docker compose logs -f`

---

## Option 2: Deploying to Free Cloud Platforms

### A. Deploy to Render (render.com)
1. Push this repository to GitHub or GitLab.
2. Sign in to [Render](https://render.com) and click **New +** &rarr; **Web Service**.
3. Select your repository.
4. Choose **Docker** as the Environment.
5. Set:
   - **Root Directory**: `smart-omr`
   - **Plan**: Free or Starter
6. Render will automatically build the multi-stage Docker container and deploy it with free HTTPS!

### B. Deploy to Railway (railway.app)
1. Go to [Railway](https://railway.app) and create a **New Project**.
2. Click **Deploy from GitHub repo** and select your repository.
3. Railway will automatically detect the `Dockerfile` in `smart-omr/` and build it.
4. Add a custom domain or use the provided `.up.railway.app` URL.

### C. Deploy to Fly.io
```bash
cd smart-omr
fly launch
fly deploy
```

---

## Option 3: Traditional Linux VPS (Ubuntu / Debian)

If deploying to an Ubuntu VM (AWS EC2, DigitalOcean Droplet, Linode, Hetzner):

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm libgl1 libglib2.0-0 nginx
```

### 2. Build Frontend Assets
```bash
cd smart-omr/frontend
npm install
npm run build
```

### 3. Setup Python Backend Environment
```bash
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed_demo_data.py
```

### 4. Create systemd Service (`/etc/systemd/system/smart-omr.service`)
```ini
[Unit]
Description=Smart OMR FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/smart-omr/backend
ExecStart=/home/ubuntu/smart-omr/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now smart-omr
```

### 5. Configure Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name omr.yourdomain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Option 4: On-Premises School / College Windows Deployment

If running directly inside a school computer lab or internal network:
1. Double-click [`run_backend.bat`](file:///d:/Hackathon_Project/smart-omr/run_backend.bat).
2. Any teacher or student on the same Wi-Fi / LAN can open:
   `http://<computer-ip-address>:8000`
   directly from their smartphone or laptop!

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port the web service listens on |
| `HOST` | `0.0.0.0` | Host IP binding (0.0.0.0 allows external network access) |
| `DATABASE_URL` | `sqlite:///./smart_omr.db` | SQLAlchemy connection URI (Can be changed to PostgreSQL or MySQL) |
| `UPLOAD_MAX_MB` | `15` | Maximum allowed photo upload size in Megabytes |

---

## Migrating from SQLite to PostgreSQL

To switch to a production PostgreSQL database, update the `DATABASE_URL` environment variable:
```bash
# Example for PostgreSQL
DATABASE_URL=postgresql://omr_user:securepassword@db.example.com:5432/smart_omr_db
```
SQLAlchemy will automatically create all tables on first startup without code changes.
