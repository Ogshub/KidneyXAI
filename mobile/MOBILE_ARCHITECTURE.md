# KidneyXAI Mobile Architecture Analysis

## 1. Existing Architecture Analysis

The KidneyXAI frontend is a React application built with Vite.

### Folder Structure
- `api/`: Axios client setup (`client.js`) and endpoint definitions (`index.js`).
- `assets/`: Static images and icons.
- `components/`:
  - `charts/`: Chart.js/Recharts implementations (`FeatureImportanceChart`, `LifestyleTrendChart`, `RiskTrendChart`, `ShapBarChart`).
  - `common/`: Reusable UI (`Button`, `Card`, `Feedback`, `Input`).
  - `layout/`: structural wrappers (`Footer`, `Layout`, `Navbar`, `ProtectedRoute`).
- `context/`: React context providers (`AuthContext`, `ThemeContext`).
- `pages/`: Page-level components corresponding to routes.
- `utils/`: Helper functions (e.g., `cloudinary.js`).

### Authentication Flow
- **Implementation**: Uses JWT (JSON Web Tokens).
- **Context**: Managed by `AuthContext.jsx`. Provides `login`, `register`, `logout`, `updateUser` methods.
- **Storage**: Tokens (`kidneycare_token`) and basic user details (`kidneycare_user`) are stored in browser `localStorage`.
- **API Interceptor**: `api/client.js` intercepts outgoing requests and appends `Authorization: Bearer <token>` if a token exists in `localStorage`.

### Reusable Components & Branding
- **UI Components**: Simple, reusable `Button`, `Input`, `Card` that enforce consistency.
- **Charts**: Significant reliance on web charting libraries.
- **Theme**: Managed via `ThemeContext.jsx` (likely Tailwind or standard CSS variables given `index.css`).

---

## 2. Migration Table

| Web Screen | Mobile Screen | Existing API Endpoint | Request Data | Response Data | Components Needed | Special Mobile Considerations |
|------------|---------------|-----------------------|--------------|---------------|-------------------|-------------------------------|
| `Landing` | `(Landing / Onboarding)` | None | N/A | N/A | Hero image, Auth buttons | Needs mobile-friendly layout and potentially a Swiper for onboarding steps. |
| `Login` | `LoginScreen` | `POST /auth/login` | `{email, password}` | `{token, userId, name, email}` | `Input`, `Button` | Keyboard avoiding view needed. |
| `Register` | `RegisterScreen` | `POST /auth/register` | `{name, email, password}` | `{token, userId, ...}` | `Input`, `Button` | Keyboard avoiding view. |
| `Dashboard` | `DashboardScreen` | `GET /dashboard` | N/A | Complex nested dashboard summary data | `Card`, `RiskTrendChart` | Data heavy; requires scroll views and mobile charting libraries (e.g., `react-native-chart-kit`). |
| `Assessment` | `AssessmentScreen` | `POST /assessments` | `{age, bloodPressure, ...}` (clinical fields) | `{id, riskScore, shapValues...}` | Form inputs, Stepper | Long forms require paginated steps or `KeyboardAwareScrollView`. |
| `AssessmentResult` | `ResultScreen` | `GET /assessments/:id` | N/A (path param) | `{id, riskScore, shapValues, ...}` | `ShapBarChart`, `Card` | SHAP charts require mobile-native charting translations. |
| `Recommendations` | `RecommendationsScreen`| `GET /recommendations?assessmentId=` | N/A (query param) | `[ {title, description, category} ]` | `Card`, List views | Use `FlatList` for efficient rendering. |
| `History` | `HistoryScreen` | `GET /assessments` | N/A | `[{id, date, riskScore}]` | `FlatList`, `Card` | Pull-to-refresh implementation. |
| `Daily Tracker` | `TrackerScreen` | `POST /activities`, `GET /activities` | `{type, value, date}` | `[{id, type, ...}]` | Form inputs, `LifestyleTrendChart` | Date picker for mobile needs native implementation (`@react-native-community/datetimepicker`). |
| `Profile` | `ProfileScreen` | `GET /profile`, `PUT /profile` | `{name, email, ...}` | `{name, email, ...}` | Form inputs, Avatar image | Image picker for profile picture (`expo-image-picker`). |
| `Settings` | `SettingsScreen` | Local State / ThemeContext | N/A | N/A | Toggles, list items | Use `react-native-safe-area-context` and React Native's `Appearance` API. |
| `ResearchSurvey` | `SurveyScreen` | `POST /research/responses`| Survey answers | `{success, id}` | Form inputs | Scrollable form. |
| `ResearchAnalytics` | `AnalyticsScreen` | `GET /research/analytics` | N/A | Aggregated data | Assorted charts | Complex to render on mobile; may be low priority for mobile version. |

---

## 3. Web to Mobile Adjustments

### What can be reused:
- **API Logic**: The endpoints, payloads, and response structures are identical.
- **Business Logic**: Most custom hooks (if any) and pure utility functions.
- **Icons & Assets**: PNG/SVG assets can be reused (SVGs require `react-native-svg`).

### What must be rewritten:
- **Routing**: `react-router-dom` becomes Expo Router (`expo-router`).
- **DOM Elements**: `<div>`, `<span>`, `<img>`, etc., become `<View>`, `<Text>`, `<Image>`.
- **CSS**: Raw CSS / Tailwind classes become `StyleSheet` objects or NativeWind.
- **Storage**: `localStorage` becomes `expo-secure-store` or `@react-native-async-storage/async-storage`.
- **Charts**: Web charting libraries (Chart.js/Recharts) must be replaced with `react-native-chart-kit` or `react-native-svg-charts`.
- **Environment Variables**: `VITE_API_BASE_URL` becomes `EXPO_PUBLIC_API_URL`.

### Potential Migration Risks:
- **Charting**: The KidneyXAI web app heavily uses SHAP and feature importance charts. Accurately translating complex SHAP waterfalls/bars to React Native can be difficult.
- **Form Handling**: The clinical assessment form is large. Mobile keyboards will hide inputs unless `KeyboardAvoidingView` or `react-native-keyboard-aware-scroll-view` is perfectly tuned.
