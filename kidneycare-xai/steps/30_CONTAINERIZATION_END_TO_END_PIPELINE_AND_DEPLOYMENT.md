# Step 30: Containerization, Multi-Service Orchestration & End-to-End Verification

## 1. Overview & Objective
In this final step, we unify the entire KidneyCare-XAI platform using Docker Compose, reverse proxies, and an end-to-end integration checklist:
1. `frontend/Dockerfile`: Multi-stage build compiling React into static bundles and serving via Nginx Alpine on port 80.
2. `frontend/nginx.conf`: Directs client-side SPA routing (`try_files $uri $uri/ /index.html`) and proxies `/api/*` to Spring Boot (`http://backend:8080/api/`).
3. `docker-compose.yml`: Multi-service orchestrator managing networking, container health dependencies, volume persistence, and startup sequences across:
   - `db` (PostgreSQL 15 on port 5432, running `schema.sql` on init)
   - `ml-service` (Python FastAPI on port 8000, model mount, health probe)
   - `backend` (Spring Boot 3 on port 8080, waiting on healthy `db` and `ml-service`)
   - `frontend` (React + Nginx on port 3000, waiting on `backend`)
4. Complete End-to-End Verification Protocol testing registration, authentication, ML prediction with SHAP, clinical rule execution, and data persistence.

---

## 2. Prerequisites
- Completed Steps 01 through 29
- Docker & Docker Compose installed (or run services locally)

---

## 3. Why This Is Created Now
1. **Deterministic Boot Order**: Spring Boot crashes on boot if PostgreSQL or the ML Service is not ready. `docker-compose.yml` uses Docker healthcheck probes (`pg_isready` and `curl -f /health`) with `condition: service_healthy` to guarantee that PostgreSQL and FastAPI are fully initialized before Spring Boot attempts JDBC connection or model probe.
2. **Reverse Proxy Unification**: React makes requests to `/api/*`. Nginx handles proxying to the Spring Boot backend inside the Docker network, completely eliminating CORS headers and port exposure in production.

---

## 4. File Implementations

### 4.1 `frontend/Dockerfile`
Path: `frontend/Dockerfile`
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 4.2 `frontend/nginx.conf`
Path: `frontend/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

### 4.3 `docker-compose.yml`
Path: `kidneycare-xai/docker-compose.yml`
```yaml
version: '3.8'

services:
  # ── PostgreSQL Database ──────────────────────────────────
  db:
    image: postgres:15-alpine
    container_name: kidneycare-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: kidneycare
      POSTGRES_USER: ${DB_USERNAME:-kidneycare}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-kidneycare_secret}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docs/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-kidneycare}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Python ML Service ────────────────────────────────────
  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile
    container_name: kidneycare-ml
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      MODEL_PATH: /app/models
      LOG_LEVEL: info
    volumes:
      - ./ml-service/models:/app/models
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ── Spring Boot Backend ──────────────────────────────────
  backend:
    build:
      context: ./backend-springboot
      dockerfile: Dockerfile
    container_name: kidneycare-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/kidneycare
      SPRING_DATASOURCE_USERNAME: ${DB_USERNAME:-kidneycare}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:-kidneycare_secret}
      JWT_SECRET: ${JWT_SECRET:-change-this-in-production-kidneycare-xai-2026}
      ML_SERVICE_URL: http://ml-service:8000
    depends_on:
      db:
        condition: service_healthy
      ml-service:
        condition: service_healthy

  # ── React Frontend ───────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: kidneycare-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 5. Full-Stack End-to-End Verification Protocol

Execute the entire platform with one command:
```powershell
cd kidneycare-xai
docker-compose up --build
```

### Verification Checklist:
1. **Container Startup Check**:
   - `kidneycare-db` starts and initializes 7 tables from `schema.sql`.
   - `kidneycare-ml` starts and answers `GET /health` with HTTP 200.
   - `kidneycare-backend` verifies DB connection and listens on port 8080.
   - `kidneycare-frontend` compiles static assets and serves Nginx on port 3000.
2. **User Registration & Login**:
   - Visit `http://localhost:3000/register`.
   - Register a user: `Alex Morgan` / `alex@example.com` / `Secret123!`.
   - Verify immediate redirection to `/dashboard` with JWT saved in `localStorage`.
3. **Assessment & TreeSHAP Verification**:
   - Navigate to `/assessment`.
   - Click **Load High-Risk Sample** (sets Creatinine $3.2$, BP $145$, Albumin $3$).
   - Click **Run Explainable Assessment**.
   - Verify `AssessmentResult` renders:
     - High Risk Score ($>0.60$).
     - `ShapBarChart` with Serum Creatinine and Blood Pressure showing prominent red bars ($\phi_i > 0$).
     - Actionable recommendations with trigger justifications (e.g. WHO Hypertension Guidelines).
4. **Lifestyle Tracking & Audit Trail**:
   - Navigate to `/tracker`.
   - Log 2.5L water, 45 min exercise, 8 hrs sleep, low salt.
   - Visit `/dashboard` and verify Lifestyle Score updates ($>80/100$).
   - Visit `/history` and verify the assessment and habit logs appear in chronological order.
5. **Research Anonymity Verification**:
   - Open an incognito browser window and visit `http://localhost:3000/research-survey`.
   - Submit a student response.
   - Verify a Participant ID (e.g. `P001`) is issued and no account login was required.

---

## 6. Congratulations!
You have successfully followed the step-by-step build of the complete **KidneyCare-XAI** platform from empty directories to a fully containerized, explainable clinical decision support system.
