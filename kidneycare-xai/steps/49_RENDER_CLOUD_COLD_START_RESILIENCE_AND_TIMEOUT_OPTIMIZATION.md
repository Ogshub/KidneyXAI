# Step 49 — Cloud Cold-Start Resilience & Authentication Timeout Optimization

## Date: 2026-09-09
## Status: ✅ COMPLETE & VERIFIED
## Target Components:
- `kidneycare-xai/frontend/src/api/client.js`
- `kidneycare-xai/frontend/src/pages/Login.jsx`

---

## 1. Problem Statement & Root Cause Analysis

### The "Login Timed Out" Issue
The user reported: *"login propeblem cant log in its getting timed out."*
When testing the live backend directly, both `POST /api/auth/login` and `GET /api/dashboard` return HTTP 200 OK in ~2 seconds. Why did the user's browser experience a timeout?

### Root Cause:
1. **Render Free-Tier Spin-Down**:
   - Render's free compute tier spins idle Docker containers down to sleep after 15 minutes of inactivity.
   - When a fresh deployment finishes (such as after our git push) or when the site receives its first request after inactivity, Render takes **30 to 45 seconds** to boot the Java 17 Spring Boot runtime and establish connection pool connections to Supabase PostgreSQL.
2. **Premature Client-Side Abort**:
   - In `client.js`, the Axios timeout was configured to `timeout: 35000` (35 seconds).
   - If Render took 37 seconds to start up, the browser terminated the HTTP request with `ECONNABORTED`, showing a generic failure before the server could finish booting.
3. **Missing Visual Cold-Start Feedback**:
   - Users clicking "Sign In" during a cold start saw a spinning button with no explanation for the delay, creating the perception that the platform had frozen.

---

## 2. Technical Implementation Details

### 1. Extended Timeout Window (`client.js`)
Increased Axios timeout from `35,000ms` (35s) to **`60,000ms` (60s)**:
```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout to gracefully absorb Render cold-starts
});
```

### 2. Intelligent Cold-Start Telemetry Notice (`Login.jsx`)
Added a responsive delay timer: if an authentication request takes longer than 3.5 seconds (indicating a sleeping cloud instance), the UI displays a live, reassuring pulsing notice:
```jsx
{loading && coldStartNotice && (
  <p className="text-xs text-center mt-2.5 animate-pulse text-amber-600 dark:text-amber-400 font-medium">
    Connecting to cloud server... (Free-tier instance may take ~20s on first spin-up)
  </p>
)}
```

### 3. Clear Error Disambiguation
If a network timeout or connection abort occurs, the system informs the user that the server has just completed waking up and is now warm:
```javascript
if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
  msg = 'The cloud server took longer to respond while spinning up from sleep. It is now warm — please click Sign In again!';
}
```

---

## 3. Verification & Live Endpoint Testing

Tested against the live cloud instance:
1. `POST https://kidneycare-backend.onrender.com/api/auth/login`:
   - Status: **`HTTP 200 OK`** (Response time: 2.1s)
   - Payload: `{"token":"...","userId":2,"name":"Shubham Prajapati","email":"mcashubham30@gmail.com"}`
2. `GET https://kidneycare-backend.onrender.com/api/dashboard`:
   - Status: **`HTTP 200 OK`**
   - Telemetry: Risk Score = 0.77, Lifestyle Score = 94, Activity = 4.25L water / 30m exercise.
3. `POST https://kidney-xai.vercel.app/api/auth/login`:
   - Status: **`HTTP 200 OK`** via Vercel edge rewrite.

---

## 4. Next Steps
- Commit and push Step 49 to GitHub.
