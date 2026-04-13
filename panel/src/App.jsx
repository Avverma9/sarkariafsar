import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Sections from './pages/Sections';
import Resources from './pages/Resources';
import Users from './pages/Users';
import Blogs from './pages/Blogs';
import Schemes from './pages/Schemes';
import MockTests from './pages/MockTests';
import Notifications from './pages/Notifications';
import CacheControl from './pages/CacheControl';
import Controls from './pages/Controls';
import AuthSettings from './pages/AuthSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="sections" element={<Sections />} />
            <Route path="resources" element={<Resources />} />
            <Route path="users" element={<Users />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="schemes" element={<Schemes />} />
            <Route path="mock-tests" element={<MockTests />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="cache" element={<CacheControl />} />
            <Route path="controls" element={<Controls />} />
            <Route path="auth-settings" element={<AuthSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
