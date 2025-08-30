'use client';

import { useState } from 'react';
import AdminAuth from '@/components/AdminAuth';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return <AdminDashboard />;
}
