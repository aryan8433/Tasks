import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AuthScreen from "./auth/AuthScreen";
import ConfigMissing from "./auth/ConfigMissing";
import { AppProvider } from "./store";
import App from "./App";
import "./index.css";

function Gate() {
  const { session, loading, configured } = useAuth();

  if (!configured) {
    return <ConfigMissing />;
  }

  if (loading) {
    return (
      <div className="auth-screen">
        <p className="loading-message">Checking session…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <AppProvider userId={session.user.id}>
      <App />
    </AppProvider>
  );
}

function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
