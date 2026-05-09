import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SymptomsPage from './pages/SymptomsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import HospitalsPage from './pages/HospitalsPage';
import EmergencyPage from './pages/EmergencyPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function ProtectedWithLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedWithLayout><DashboardPage /></ProtectedWithLayout>} />
          <Route path="/symptoms" element={<ProtectedWithLayout><SymptomsPage /></ProtectedWithLayout>} />
          <Route path="/prescriptions" element={<ProtectedWithLayout><PrescriptionsPage /></ProtectedWithLayout>} />
          <Route path="/hospitals" element={<ProtectedWithLayout><HospitalsPage /></ProtectedWithLayout>} />
          <Route path="/emergency" element={<ProtectedWithLayout><EmergencyPage /></ProtectedWithLayout>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
