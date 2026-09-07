# Step 34 — User Profile Picture & Supabase Schema Update

## Date: 2026-09-07
## Status: ✅ COMPLETE

---

## Overview

Extended the `users` table in both the live Supabase PostgreSQL database and the Spring Boot JPA entity to support user profile pictures, bio, phone, affiliation, and timezone. Updated the full stack — database, backend entity/DTOs/service, and frontend API/context/pages.

---

## Database Migration (Supabase)

### SQL Applied via Supabase MCP

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS affiliation VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC+05:30';
```

### Verification — Column Listing After Migration

| Column | Type | Max Length | Default |
|---|---|---|---|
| id | bigint | — | nextval sequence |
| created_at | timestamp | — | — |
| email | varchar | 255 | — |
| name | varchar | 100 | — |
| password_hash | varchar | 255 | — |
| role | varchar | 20 | — |
| updated_at | timestamp | — | — |
| **profile_picture_url** | **text** | — | — |
| **bio** | **text** | — | — |
| **phone** | **varchar** | **30** | — |
| **affiliation** | **varchar** | **255** | — |
| **timezone** | **varchar** | **50** | **'UTC+05:30'** |

All 5 new columns confirmed via `information_schema.columns` query.

---

## Files Modified

### Database Schema Documentation
- **`docs/database/schema.sql`** — Updated `CREATE TABLE users` with 5 new columns and inline comments

### Backend (Spring Boot)
- **`entity/User.java`** — Added `profilePictureUrl`, `bio`, `phone`, `affiliation`, `timezone` fields with JPA column annotations
- **`dto/request/ProfileUpdateRequest.java`** — Added 5 new fields with `@Size` validation constraints
- **`dto/response/ProfileResponse.java`** — Added 5 new fields to the response builder
- **`service/ProfileService.java`** — `getProfile()` now includes all new user-level fields; `updateProfile()` sets them if provided

### Frontend — API Layer
- **`frontend/src/api/index.js`** — Added `profileApi.uploadProfilePicture(base64DataUrl)` method

### Frontend — Context
- **`frontend/src/context/AuthContext.jsx`** — `login()` and `register()` now store `profilePictureUrl` in user state

### Frontend — Pages
- **`frontend/src/pages/Profile.jsx`** — Added `bio`, `phone`, `affiliation` input fields; loads `profilePictureUrl` from API
- **`frontend/src/pages/Settings.jsx`** — Avatar upload persists locally (base64); avatar display updated for both themes

### Frontend — Layout
- **`frontend/src/components/layout/Navbar.jsx`** — Shows real `profilePictureUrl` from user context if available

---

## Profile Picture Strategy

Profile pictures are stored as **base64 data URLs** in the `profile_picture_url` TEXT column. This approach:
- ✅ No additional Supabase Storage bucket configuration needed
- ✅ Self-contained — picture travels with the user record
- ✅ Works offline once loaded
- ⚠️ Limited to ~2MB files (enforced by frontend validation)

For production scale, this could be migrated to Supabase Storage with signed URLs.

---

## Verification

```bash
# Supabase schema verified via MCP execute_sql
# Frontend build
cd frontend && npm run build
# ✅ Build succeeded with exit code 0
```

---

## Next Step Dependency
→ Step 35: Brutalist Theme Full Application Integration
