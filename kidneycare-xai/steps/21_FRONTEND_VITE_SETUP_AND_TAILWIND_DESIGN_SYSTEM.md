# Step 21: Frontend — Vite Setup, Tooling & Tailwind Design System

## 1. Overview & Objective
In this step, we configure the React 19 web application build pipeline using Vite, Tailwind CSS v4, Lucide icons, and Chart.js in `frontend/`:
1. `package.json`: Specifying React 19, React Router v7, Axios, Chart.js, React-Chartjs-2, and Tailwind v4.
2. `vite.config.js`: Vite configuration with React compiler plugin, Tailwind CSS v4 bundler plugin, and local API proxy routing `/api/*` to Spring Boot (`http://localhost:8080`).
3. `index.html`: Entry HTML document with Google Inter typography font preloading.
4. `src/index.css`: Base design system tokens (Teal primary `#0d9488`, slate neutrals, sleek custom scrollbar, layout reset).

---

## 2. Prerequisites
- Node.js (>= 18.0) and npm installed locally

---

## 3. Why This Is Created Now
1. **API Proxying**: In local development, the React frontend runs on `localhost:3000` (or `5173`) while Spring Boot runs on `localhost:8080`. Configuring Vite's `server.proxy` allows developers to call `/api/auth/login` without experiencing browser cross-origin policy issues.
2. **Design Tokens**: Defining CSS variables (`--primary`, `--primary-light`, `--navy-900`) and the clean Inter font upfront ensures consistent styling across all 11 pages and reusable component cards.

---

## 4. File Implementations

### 4.1 `frontend/package.json`
Path: `frontend/package.json`
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.20.0",
    "chart.js": "^4.5.1",
    "lucide-react": "^1.41.0",
    "react": "^19.2.8",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "oxlint": "^1.79.0",
    "tailwindcss": "^4.3.3",
    "vite": "^8.2.2"
  }
}
```

---

### 4.2 `frontend/vite.config.js`
Path: `frontend/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

---

### 4.3 `frontend/src/index.css`
Path: `frontend/src/index.css`
```css
@import "tailwindcss";

@layer base {
  :root {
    --primary: #0d9488;
    --primary-hover: #0f766e;
    --primary-light: #ccfbf1;
    --navy-900: #0f172a;
    --navy-800: #1e293b;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

---

## 5. Verification
Install frontend dependencies:
```powershell
cd kidneycare-xai/frontend
npm install
```

---

## 6. Next Step Dependency
Proceed to **`22_FRONTEND_API_CLIENT_AND_AUTH_CONTEXT.md`** to implement the centralized Axios HTTP client, token interceptors, and React global `AuthContext`.
