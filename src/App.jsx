import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import VehiclesPage    from './pages/VehiclesPage';
import TripsPage       from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import ExpensesPage    from './pages/ExpensesPage';
import DriversPage     from './pages/DriversPage';
import AnalyticsPage   from './pages/AnalyticsPage';
import SetupPage       from './pages/SetupPage';
import './index.css';

function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useApp();
  const location = useLocation();
  
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vehicles"  element={<VehiclesPage />} />
        <Route path="/trips"     element={<TripsPage />} />
        <Route path="/drivers"   element={<DriversPage />} />
        <Route path="/expenses"  element={<ExpensesPage />} />
        <Route
          path="/maintenance"
          element={
            <RequireAuth allowedRoles={['Manager']}>
              <MaintenancePage />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth allowedRoles={['Manager']}>
              <AnalyticsPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
