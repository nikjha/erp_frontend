import { type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ModuleListPage from "./pages/ModuleListPage";
import ModuleDetailPage from "./pages/ModuleDetailPage";
import VendorQuoteComparisonPage from "./pages/VendorQuoteComparisonPage";
import ModuleSettingsPage from "./pages/ModuleSettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/:moduleKey" element={<RequireAuth><ModuleListPage /></RequireAuth>} />
      <Route path="/rfqs/:id/compare" element={<RequireAuth><VendorQuoteComparisonPage /></RequireAuth>} />
      <Route path="/settings/modules" element={<RequireAuth><ModuleSettingsPage /></RequireAuth>} />
      <Route path="/:moduleKey/:id" element={<RequireAuth><ModuleDetailPage /></RequireAuth>} />
      {/* Anything deeper or stranger than the routes above. Unknown single
          segments are caught by ModuleListPage instead, since /:moduleKey
          matches them first. */}
      <Route path="*" element={<RequireAuth><NotFoundPage /></RequireAuth>} />
    </Routes>
  );
}
