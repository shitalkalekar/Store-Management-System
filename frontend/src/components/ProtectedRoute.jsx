import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
