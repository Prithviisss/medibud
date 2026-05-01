import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SymptomsPage from './pages/SymptomsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import HospitalsPage from './pages/HospitalsPage';
import EmergencyPage from './pages/EmergencyPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/symptoms" element={<ProtectedRoute><SymptomsPage /></ProtectedRoute>} />
        <Route path="/prescriptions" element={<ProtectedRoute><PrescriptionsPage /></ProtectedRoute>} />
        <Route path="/hospitals" element={<ProtectedRoute><HospitalsPage /></ProtectedRoute>} />
        <Route path="/emergency" element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
