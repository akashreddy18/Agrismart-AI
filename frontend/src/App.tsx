import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import Expenses from './pages/Expenses';
import Calculator from './pages/Calculator';
import Labour from './pages/Labour';
import Market from './pages/Market';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Crops from './pages/Crops';
import Fertilizer from './pages/Fertilizer';
import Irrigation from './pages/Irrigation';
import MLPredictions from './pages/MLPredictions';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-bold text-lg">
        Loading AgriSmart AI...
      </div>
    );
  }

  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard/Farming Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/farms"
          element={
            <PrivateRoute>
              <Layout>
                <Farms />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/crops"
          element={
            <PrivateRoute>
              <Layout>
                <Crops />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/fertilizer"
          element={
            <PrivateRoute>
              <Layout>
                <Fertilizer />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/irrigation"
          element={
            <PrivateRoute>
              <Layout>
                <Irrigation />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <PrivateRoute>
              <Layout>
                <Expenses />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/calculator"
          element={
            <PrivateRoute>
              <Layout>
                <Calculator />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/labour"
          element={
            <PrivateRoute>
              <Layout>
                <Labour />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/market"
          element={
            <PrivateRoute>
              <Layout>
                <Market />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/assistant"
          element={
            <PrivateRoute>
              <Layout>
                <Assistant />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/predictions"
          element={
            <PrivateRoute>
              <Layout>
                <MLPredictions />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
