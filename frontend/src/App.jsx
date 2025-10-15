import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import WasteList from './components/WasteList';
import AddWaste from './components/AddWaste';
import ProjectForm from './components/ProjectForm';
import Profile from './components/Profile';
import MapPage from './components/MapPage'; // Import MapPage
import EditWaste from './components/EditWaste';
import VerificationFailed from './components/VerificationFailed'; // Importar componente
import PublicTrazabilidad from './components/PublicTrazabilidad'; // Importar componente de trazabilidad
import PrivateRoute from './components/PrivateRoute';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
          <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
          <Route path="/reset-password/:token" element={<AuthLayout><ResetPassword /></AuthLayout>} />
          <Route path="/verification-failed" element={<AuthLayout><VerificationFailed /></AuthLayout>} />
          <Route path="/trazabilidad/:id" element={<PublicTrazabilidad />} /> {/* Nueva ruta pública */}
          <Route path="/" element={<AuthLayout><Login /></AuthLayout>} />

          {/* Private Routes with Main Layout */}
          <Route path="/dashboard" element={<Layout><PrivateRoute><Dashboard /></PrivateRoute></Layout>} />
          <Route path="/agregar-residuo" element={<Layout><PrivateRoute><AddWaste /></PrivateRoute></Layout>} />
          <Route path="/edit-project/:id" element={<Layout><PrivateRoute><ProjectForm /></PrivateRoute></Layout>} />
          <Route path="/perfil" element={<Layout><PrivateRoute><Profile /></PrivateRoute></Layout>} />
          <Route path="/mapa" element={<Layout><PrivateRoute><MapPage /></PrivateRoute></Layout>} /> {/* New Map Route */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;