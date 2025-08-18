import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check for a token in localStorage (or use your auth context)
    const token = localStorage.getItem('token');
    
    // If there's no token, redirect to the login page
    if (!token) {
        return <Navigate to="/login" />;
    }
    
    // Otherwise, allow access to the protected component
    return children;
};

export default ProtectedRoute;