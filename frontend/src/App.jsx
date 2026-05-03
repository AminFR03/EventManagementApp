import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateEventPage from './pages/CreateEventPage';
import MyTicketsPage from './pages/MyTicketsPage';
import ProfilePage from './pages/ProfilePage';
import CategoriesPage from './pages/CategoriesPage';
import EventDetailPage from './pages/EventDetailPage';
import CalendarPage from './pages/CalendarPage';
import AdminDashboard from './pages/AdminDashboard';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ReportsPage from './pages/ReportsPage';

function ProtectedRoute({ children, roleRequired }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired && user.role !== 'ADMIN') return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EventsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/event/:id" element={<EventDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/create-event" element={
        <ProtectedRoute roleRequired="ORGANIZER"><CreateEventPage /></ProtectedRoute>
      } />
      <Route path="/my-tickets" element={
        <ProtectedRoute><MyTicketsPage /></ProtectedRoute>
      } />
      <Route path="/payment-history" element={
        <ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      } />
      
      {/* Organizer & Admin Routes */}
      <Route path="/reports" element={
        <ProtectedRoute roleRequired="ORGANIZER"><ReportsPage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roleRequired="ADMIN"><AdminDashboard /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
