// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/contextAuth';
import ProtectedRoute from './components/commons/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import ProfileDetail from './pages/ProfileDetail';
import Search from './pages/Search';
import Account from './pages/Account';
// import { useAuthStore } from './hooks/useAuth';

function App() {
  // const { authUser, onlineUsers, checkUserAuth, isCheckingAuth } = useAuthStore();

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={ <Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profiles" element={
            <ProtectedRoute>
              <Profiles />
            </ProtectedRoute>
          } />
          <Route path="/profiles/:id" element={
            <ProtectedRoute>
              <ProfileDetail />
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;