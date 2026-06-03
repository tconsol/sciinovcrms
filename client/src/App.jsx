import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/ClientsList';
import ClientForm from './pages/ClientForm';
import ClientDetails from './pages/ClientDetails';
import Payments from './pages/Payments';
import FollowUps from './pages/FollowUps';
import ActivityLogs from './pages/ActivityLogs';
import AdminPage from './pages/AdminPage';
import History from './pages/History';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function SuperAdminRoute({ children }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  return isSuperAdmin ? children : <Navigate to="/clients" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminRoute><Dashboard /></SuperAdminRoute>} />
        <Route path="clients" element={<ClientsList />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="payments" element={<Payments />} />
        <Route path="conversations" element={<FollowUps />} />
        <Route path="history" element={<History />} />
        <Route path="activity-logs" element={<SuperAdminRoute><ActivityLogs /></SuperAdminRoute>} />
        <Route path="admin" element={<SuperAdminRoute><AdminPage /></SuperAdminRoute>} />
      </Route>
    </Routes>
  );
}
