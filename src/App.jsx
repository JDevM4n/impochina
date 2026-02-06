import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading para mejor performance
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const BodegaPage = React.lazy(() => import('./pages/BodegaPage'));
const ReportesPage = React.lazy(() => import('./pages/ReportesPage'));


// Componente de loading
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
      <p>Cargando Impochina...</p>
    </div>
  </div>
);

function App() {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Rutas protegidas */}
              <Route 
                path="/home" 
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bodega" 
                element={
                  <ProtectedRoute>
                    <BodegaPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reportes" 
                element={
                  <ProtectedRoute>
                    <ReportesPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta por defecto */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              
              {/* Ruta 404 */}
              <Route path="*" element={
                <div style={{ padding: '50px', textAlign: 'center' }}>
                  <h1>404 - Página no encontrada</h1>
                  <p>La página que buscas no existe.</p>
                  <a href="/home">Volver al inicio</a>
                </div>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </React.Suspense>
  );
}

export default App;