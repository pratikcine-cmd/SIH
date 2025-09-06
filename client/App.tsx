import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DietPlanPage from "./pages/DietPlan";
import Tracking from "./pages/Tracking";
import Recipes from "./pages/Recipes";
import Scan from "./pages/Scan";
import { AppLayout } from "./components/app/Layout";
import { AppStateProvider, useAppState } from "@/context/app-state";
import { lazy, Suspense } from "react";
const DoctorMessagesLazy = lazy(() => import("./pages/DoctorMessages"));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppState();
  if (!currentUser) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const UserGuard: React.FC = () => {
  const { currentUser } = useAppState();
  if (currentUser?.role !== "user") return <Navigate to="/doctor" replace />;
  return <Outlet />;
};

const DoctorGuard: React.FC = () => {
  const { currentUser } = useAppState();
  if (currentUser?.role !== "doctor") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route element={<UserGuard />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/diet-plan" element={<DietPlanPage />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/scan" element={<Scan />} />
      </Route>
      <Route element={<DoctorGuard />}>
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/messages" element={<Suspense fallback={null}><DoctorMessagesLazy /></Suspense>} />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <AppStateProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppStateProvider>
  </TooltipProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
