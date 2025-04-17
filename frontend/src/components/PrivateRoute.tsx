import React from 'react';
import { Navigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode; // This defines 'children' as any valid React node
};

const PrivateRoute = ({ children }: Props) => {
  const token = localStorage.getItem('access_token');

  // If the token is available, render the children, otherwise redirect to login
  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;