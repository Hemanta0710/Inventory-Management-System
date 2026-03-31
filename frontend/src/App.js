import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import AIAssistant from './pages/AIAssistant';
import Users from './pages/Users';
import Reports from './pages/Reports';
import './index.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
            <Route path="orders" element={
              <PrivateRoute roles={['ROLE_ADMIN','ROLE_MANAGER']}><Orders /></PrivateRoute>} />
            <Route path="suppliers" element={
              <PrivateRoute roles={['ROLE_ADMIN','ROLE_MANAGER']}><Suppliers /></PrivateRoute>} />
            <Route path="ai" element={
              <PrivateRoute roles={['ROLE_ADMIN','ROLE_MANAGER']}><AIAssistant /></PrivateRoute>} />
            <Route path="reports" element={
              <PrivateRoute roles={['ROLE_ADMIN','ROLE_MANAGER']}><Reports /></PrivateRoute>} />
            <Route path="users" element={
              <PrivateRoute roles={['ROLE_ADMIN']}><Users /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
