import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function PublicRoute({ user }) {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
