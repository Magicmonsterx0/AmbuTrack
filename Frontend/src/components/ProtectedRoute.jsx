import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check if the browser has a saved JWT token
    const token = localStorage.getItem('token');

    if (!token) {
        // No token found? Instantly redirect them to the login page.
        // "replace" ensures they can't just click the back button to bypass it.
        return <Navigate to="/login" replace />;
    }

    // If they have a token, render the requested page (children)
    return children;
};

export default ProtectedRoute;