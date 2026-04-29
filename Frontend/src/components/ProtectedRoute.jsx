import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute
 *
 * Guards any route that requires login (currently just /driver).
 *
 * ORIGINAL BUG: Only checked if a token existed in localStorage.
 * An expired token (e.g. from yesterday's 12h shift) would still pass,
 * letting the user into the Driver page where the socket would then
 * immediately reject them with an auth-error.
 *
 * FIX: We decode the JWT payload manually (no library needed — the payload
 * is just base64, not secret) and check the `exp` timestamp against now.
 * If the token is expired or malformed, we clear localStorage and redirect
 * to login so the user gets a clean session.
 */
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // No token at all → send to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        // JWT structure: header.payload.signature
        // The payload is base64url encoded — decode it to read the expiry time.
        // This does NOT verify the signature (only the server can do that),
        // but it does catch expired tokens before wasting a socket connection.
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));

        // `exp` is in seconds, Date.now() is in milliseconds
        if (Date.now() >= payload.exp * 1000) {
            // Token has expired — wipe the stale session and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('driverName');
            localStorage.removeItem('plateNumber');
            return <Navigate to="/login" replace />;
        }
    } catch {
        // Malformed token — clear and redirect
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }

    // Token exists and is not expired — allow access
    return children;
};

export default ProtectedRoute;