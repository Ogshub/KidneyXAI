# API Contracts

This document outlines every backend API endpoint that the mobile application will need, based on the existing web application's integration.

## Base URL
Will be configured via environment variables (e.g., `EXPO_PUBLIC_API_URL`). All paths below are relative to this base URL (e.g., `/api`).

## Authentication Requirement
Endpoints require a JWT Bearer token in the `Authorization` header unless marked as **Public**.

---

## 1. Authentication Endpoints

### 1.1 Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Authentication**: **Public**
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Expected Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "userId": "uuid-string",
    "name": "John Doe",
    "email": "user@example.com",
    "profilePictureUrl": "https://..."
  }
  ```
- **Where it is used**: `LoginScreen`

### 1.2 Register
- **Method**: `POST`
- **Path**: `/auth/register`
- **Authentication**: **Public**
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Expected Response**: Same as Login.
- **Where it is used**: `RegisterScreen`

---

## 2. Profile Endpoints

### 2.1 Get Profile
- **Method**: `GET`
- **Path**: `/profile`
- **Authentication**: Required
- **Where it is used**: `ProfileScreen`, `DashboardScreen`

### 2.2 Update Profile
- **Method**: `PUT`
- **Path**: `/profile`
- **Authentication**: Required
- **Request Body**: (Varies, but includes `name`, `email`, `profilePictureUrl`)
- **Where it is used**: `ProfileScreen`

### 2.3 Get Health Profile
- **Method**: `GET`
- **Path**: `/health-profile`
- **Authentication**: Required
- **Where it is used**: `ProfileScreen`, `AssessmentScreen` (for pre-filling)

### 2.4 Update Health Profile
- **Method**: `PUT`
- **Path**: `/health-profile`
- **Authentication**: Required
- **Request Body**: Demographics and static clinical details
- **Where it is used**: `ProfileScreen`

---

## 3. Assessment Endpoints

### 3.1 Create Assessment
- **Method**: `POST`
- **Path**: `/assessments`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "age": 45,
    "bloodPressure": 120,
    "specificGravity": 1.02,
    "albumin": 0,
    "sugar": 0,
    "redBloodCells": "normal",
    "pusCell": "normal",
    "pusCellClumps": "notpresent",
    "bacteria": "notpresent",
    "bloodGlucoseRandom": 120,
    "bloodUrea": 30,
    "serumCreatinine": 1.2,
    "sodium": 135,
    "potassium": 4.5,
    "hemoglobin": 15,
    "packedCellVolume": 44,
    "whiteBloodCellCount": 7800,
    "redBloodCellCount": 5.2,
    "hypertension": "no",
    "diabetesMellitus": "no",
    "coronaryArteryDisease": "no",
    "appetite": "good",
    "pedalEdema": "no",
    "anemia": "no"
  }
  ```
- **Expected Response**: Assessment ID and results, including `riskScore` and `shapValues`.
- **Where it is used**: `AssessmentScreen`

### 3.2 Get Assessments (History)
- **Method**: `GET`
- **Path**: `/assessments`
- **Authentication**: Required
- **Where it is used**: `HistoryScreen`

### 3.3 Get Assessment By ID
- **Method**: `GET`
- **Path**: `/assessments/:id`
- **Authentication**: Required
- **Where it is used**: `ResultScreen`

### 3.4 Get Model Evaluation
- **Method**: `GET`
- **Path**: `/assessments/model-evaluation`
- **Authentication**: Required
- **Where it is used**: `AnalyticsScreen` / Research

---

## 4. Activities (Daily Tracker) Endpoints

### 4.1 Log Activity
- **Method**: `POST`
- **Path**: `/activities`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "type": "water",
    "value": 1500,
    "date": "2026-09-20T00:00:00Z"
  }
  ```
- **Where it is used**: `TrackerScreen`

### 4.2 Get Activities
- **Method**: `GET`
- **Path**: `/activities`
- **Query Params**: `from` (optional date string), `to` (optional date string)
- **Authentication**: Required
- **Where it is used**: `TrackerScreen`

---

## 5. Recommendations Endpoint

### 5.1 Get Recommendations
- **Method**: `GET`
- **Path**: `/recommendations`
- **Query Params**: `assessmentId` (optional)
- **Authentication**: Required
- **Where it is used**: `RecommendationsScreen`

---

## 6. Dashboard Endpoint

### 6.1 Get Dashboard
- **Method**: `GET`
- **Path**: `/dashboard`
- **Authentication**: Required
- **Where it is used**: `DashboardScreen`

---

## 7. Research Endpoints

### 7.1 Submit Survey
- **Method**: `POST`
- **Path**: `/research/responses`
- **Authentication**: Required
- **Where it is used**: `SurveyScreen`

### 7.2 Get Analytics
- **Method**: `GET`
- **Path**: `/research/analytics`
- **Authentication**: Required
- **Where it is used**: `AnalyticsScreen`
