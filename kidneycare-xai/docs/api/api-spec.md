# KidneyCare-XAI — REST API Specification

This document provides the formal contract for the Spring Boot Orchestrator REST API and Python FastAPI ML inference service.

---

## Base URLs

- **Spring Boot Backend**: `http://localhost:8080/api`
- **FastAPI ML Service**: `http://localhost:8000`

---

## Authentication & Headers

All protected endpoints require an HTTP `Authorization` header containing a valid JSON Web Token:
```http
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new user account and returns an auth token.

**Request Body:**
```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOi...",
  "id": 1,
  "name": "Alex Morgan",
  "email": "alex@example.com"
}
```

### `POST /auth/login`
Authenticates existing credentials and returns an auth token.

**Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOi...",
  "id": 1,
  "name": "Alex Morgan",
  "email": "alex@example.com"
}
```

---

## 2. User & Health Profile

### `GET /profile` *(Protected)*
Returns the current user's profile and auto-calculated BMI.

### `PUT /profile` *(Protected)*
Updates demographics and body metrics.
```json
{
  "name": "Alex Morgan",
  "age": 45,
  "gender": "Male",
  "heightCm": 175.0,
  "weightKg": 72.5
}
```

### `GET /health-profile` *(Protected)*
Returns medical history (diabetes, hypertension, smoking, alcohol, painkiller usage).

### `PUT /health-profile` *(Protected)*
Updates medical history conditions.

---

## 3. Clinical Risk Assessments

### `POST /assessments` *(Protected)*
Submits clinical features, calls Python ML service for XGBoost prediction and local SHAP explanations, persists results, and generates traceable recommendations.

**Request Body:**
```json
{
  "age": 52.0,
  "bloodPressure": 80.0,
  "specificGravity": 1.020,
  "albumin": 0.0,
  "sugar": 0.0,
  "redBloodCells": "normal",
  "pusCell": "normal",
  "pusCellClumps": "notpresent",
  "bacteria": "notpresent",
  "bloodGlucoseRandom": 115.0,
  "bloodUrea": 38.0,
  "serumCreatinine": 1.1,
  "sodium": 139.0,
  "potassium": 4.2,
  "hemoglobin": 15.0,
  "packedCellVolume": 45.0,
  "whiteBloodCellCount": 7200.0,
  "redBloodCellCount": 5.1,
  "hypertension": "no",
  "diabetesMellitus": "no",
  "coronaryArteryDisease": "no",
  "appetite": "good",
  "pedalEdema": "no",
  "anemia": "no"
}
```

**Response (200 OK):**
```json
{
  "id": 12,
  "riskScore": 0.18,
  "riskCategory": "LOW",
  "prediction": "LOW_RISK",
  "modelVersion": "1.0.0",
  "createdAt": "2026-09-04T18:00:00",
  "explanations": [
    { "feature": "serum_creatinine", "value": 1.1, "shapValue": -0.14 },
    { "feature": "blood_urea", "value": 38.0, "shapValue": -0.08 }
  ],
  "recommendations": [
    {
      "id": 45,
      "category": "HYDRATION",
      "recommendationText": "Maintain daily fluid intake of 2.0–2.5 L to sustain optimal glomerular filtration.",
      "priority": "ROUTINE",
      "triggerReason": "Routine preventive renal maintenance rule.",
      "source": "Clinical Rule Engine"
    }
  ]
}
```

### `GET /assessments` *(Protected)*
Returns chronological list of all assessments completed by the authenticated user.

### `GET /assessments/{id}` *(Protected)*
Returns detail of a single assessment including all SHAP features.

---

## 4. Daily Lifestyle Tracking

### `POST /activities` *(Protected)*
Logs daily lifestyle habits (upserts on user + date).
```json
{
  "activityDate": "2026-09-04",
  "waterIntakeLiters": 2.5,
  "exerciseMinutes": 45,
  "sleepHours": 7.5,
  "saltLevel": "Low",
  "fastFood": false,
  "sugaryDrinks": 0,
  "smoking": false,
  "alcohol": false,
  "weightKg": 72.0,
  "stressLevel": "Low"
}
```

### `GET /activities` *(Protected)*
Returns activity logs with optional `from` and `to` date parameters.

---

## 5. Decision Support Recommendations

### `GET /recommendations` *(Protected)*
Returns active and historical recommendations. Optional `assessmentId` query param.

---

## 6. Dashboard Composite Endpoint

### `GET /dashboard` *(Protected)*
Returns aggregated composite payload:
- `currentRiskScore` & `currentRiskCategory`
- `lifestyleScore` (0–100)
- `todayActivity`
- `topContributors` (SHAP)
- `recentRecommendations`
- `riskHistory` (for Chart.js)
- `activityTrend` (for Chart.js)

---

## 7. Public Campus Research (Dataset B)

### `POST /research/responses` *(Public)*
Submits anonymized college lifestyle and kidney health awareness survey.
```json
{
  "participantId": "COL-A8F2K",
  "role": "Student",
  "ageGroup": "18-22",
  "gender": "Prefer not to say",
  "diabetes": "No",
  "hypertension": "No",
  "familyHistory": "No",
  "painkillerUsage": "Rarely",
  "waterIntake": "2-3L",
  "exercise": "3-4 days/week",
  "sleepHours": "7-8",
  "saltyProcessed": "Sometimes",
  "fastFood": "1-2 times/week",
  "sugaryDrinks": "1/day",
  "smoking": "No",
  "alcohol": "No",
  "awareEarlySymptoms": true,
  "awareRiskFactors": true,
  "monitorsBp": false,
  "receivedKidneyInfo": true
}
```
