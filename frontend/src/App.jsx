import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ModeProvider } from './context/ModeContext.jsx';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import AddWaste from './components/AddWaste';
import ProjectForm from './components/ProjectForm';
import Profile from './components/Profile';
import MapPage from './components/MapPage';
import VerificationFailed from './components/VerificationFailed';
import PublicTrazabilidad from './components/PublicTrazabilidad'; // Importar componente de trazabilidad
import ProfilePage from './components/ProfilePage';
import ProfileLayout from './components/ProfileLayout';
import GestorLayout from './components/GestorLayout';
import DetalleResiduo from './components/DetalleResiduo';
import GestorDashboard from './components/GestorDashboard';
import PrivateRoute from './components/PrivateRoute';


function App() {
  return (
    <ModeProvider>
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

            {/* Private Routes for Constructora */}
            <Route path="/dashboard" element={<Layout><PrivateRoute perfilRequerido="constructora"><Dashboard /></PrivateRoute></Layout>} />
            <Route path="/agregar-residuo" element={<Layout><PrivateRoute perfilRequerido="constructora"><AddWaste /></PrivateRoute></Layout>} />
            <Route path="/edit-project/:id" element={<Layout><PrivateRoute perfilRequerido="constructora"><ProjectForm /></PrivateRoute></Layout>} />
            <Route path="/mapa" element={<Layout><PrivateRoute perfilRequerido="constructora"><MapPage /></PrivateRoute></Layout>} />

            {/* Private Routes for Gestor */}
            <Route path="/gestor/dashboard" element={<GestorLayout><PrivateRoute perfilRequerido="gestora"><GestorDashboard /></PrivateRoute></GestorLayout>} />
            <Route path="/gestor/residuo/:id" element={<GestorLayout><PrivateRoute perfilRequerido="gestora"><DetalleResiduo /></PrivateRoute></GestorLayout>} />

            {/* Shared Private Route */}
            <Route path="/perfil" element={<ProfileLayout><PrivateRoute><ProfilePage /></PrivateRoute></ProfileLayout>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ModeProvider>
  );
}

export default App;
