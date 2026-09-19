# Mobile Migration Plan

This document outlines the phased approach to migrating the web frontend of KidneyXAI to the new React Native + Expo mobile application.

## Phased Implementation Strategy

### Phase A — Project Foundation
- Set up Expo Router with the required layout structure (`_layout.tsx`).
- Configure environment variables (`.env` and `EXPO_PUBLIC_API_URL`).
- Setup custom fonts, themes, and global stylesheets to match existing KidneyXAI branding.
- Implement reusable UI components (`Button`, `Card`, `Input`, `Feedback`) in React Native.
- Setup an API client using `axios` similar to `frontend/src/api/client.js`.

### Phase B — Authentication
- Implement `SecureStore` for JWT storage instead of `localStorage`.
- Create `AuthContext` to manage token, user state, and login/logout methods.
- Build the `LoginScreen` and `RegisterScreen` with form validation and API integration.
- Implement a protected route wrapper or use Expo Router's protected groups.

### Phase C — Navigation
- Set up bottom tabs navigation for main app sections (Dashboard, Tracker, Assessment, Profile).
- Create stack navigation for nested screens (Assessment -> Result, History).

### Phase D — Dashboard
- Build `DashboardScreen`.
- Implement API call to `/dashboard`.
- Render summary cards and widgets.
- Implement a lightweight mobile chart for risk trends (e.g., using `react-native-chart-kit`).

### Phase E — Assessment
- Build `AssessmentScreen` (Clinical input form).
- Use `KeyboardAwareScrollView` to handle the large number of inputs.
- Implement form validation matching the web version.
- Connect to `POST /assessments`.

### Phase F — Prediction / Result
- Build `ResultScreen` to display risk score and insights.
- **Challenge**: Translate the `ShapBarChart` and `FeatureImportanceChart` to mobile. Will likely require a custom SVG implementation or a dedicated mobile charting library capable of horizontal bar charts with specific coloring.

### Phase G — History
- Build `HistoryScreen`.
- Implement a `FlatList` to render previous assessments.
- Connect to `GET /assessments` and allow tapping an item to view its `ResultScreen`.

### Phase H — Tracker
- Build `TrackerScreen` for logging daily activities.
- Integrate native date picker (`@react-native-community/datetimepicker`).
- Fetch and display the lifestyle trend chart.

### Phase I — Recommendations
- Build `RecommendationsScreen`.
- Fetch data from `GET /recommendations` and render as a list.

### Phase J — Profile & Settings
- Build `ProfileScreen` with form for user info and health profile.
- Implement image picker (`expo-image-picker`) for avatar uploads.
- Build `SettingsScreen` leveraging React Native's `Appearance` module for light/dark themes.

### Phase K — Testing
- Conduct device testing (Android Emulator, iOS Simulator, Physical devices).
- Perform end-to-end user flows (Register -> Assessment -> Result -> History).
- Verify secure storage behavior and token expiration handling.

### Phase L — Production Build
- Configure `app.json` with correct bundle identifiers, names, and icons.
- Build using EAS (Expo Application Services).
- Prepare for Play Store and App Store deployment.

---

## Technical Considerations & Risk Mitigation

### Browser-specific code
- **Local Storage**: Cannot use `window.localStorage`. Must be replaced with `expo-secure-store` for sensitive tokens and `@react-native-async-storage/async-storage` for generic app preferences.
- **Routing**: `react-router-dom` is web-only. Expo Router (file-based routing) replaces this completely.

### React DOM Components
- All HTML tags (`div`, `span`, `p`, `h1`, `input`, `img`) must be replaced with React Native primitives (`View`, `Text`, `TextInput`, `Image`).
- CSS classes (including Tailwind if used) must be refactored into React Native `StyleSheet` or handled by NativeWind if configured.

### Web-only Chart Libraries
- Chart.js / Recharts are DOM-dependent.
- We must evaluate `react-native-chart-kit`, `react-native-svg-charts`, or `Victory Native` for reproducing the Feature Importance, Trend, and SHAP visualizations.

### API & Network
- Localhost development on Android emulators requires mapping `127.0.0.1` or `localhost` to `10.0.2.2`. The `EXPO_PUBLIC_API_URL` should point to the local network IP or `10.0.2.2` rather than `localhost`.
- Axios interceptors will need to reference `SecureStore` asynchronously, which may require refactoring how the interceptor fetches the token (since `SecureStore.getItemAsync` is asynchronous while `localStorage.getItem` is synchronous).
