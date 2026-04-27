import { useState } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [errorMsg, setErrorMsg] = useState(''); // Add this to your state variables at the top!

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(''); // Clear any old errors

        try {
            // 1. Send the email and password to the Node.js backend
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                email,
                password
            });

            // 2. If successful, extract the token and driver data
            const { token, driverData } = response.data;

            // 3. Save the token and data securely in the browser's Local Storage
            localStorage.setItem('token', token);
            localStorage.setItem('driverName', driverData.name);
            localStorage.setItem('plateNumber', driverData.plateNumber);

            console.log("✅ Successfully logged in and saved token!");

            // 4. Redirect them to the secure Driver Terminal
            navigate('/driver');

        } catch (error) {
            console.error("Login failed:", error);
            // Show the error message sent from the backend (e.g., "Invalid credentials")
            setErrorMsg(error.response?.data?.message || "An error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-70px)] bg-surface-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-surface-200">
                        <ShieldCheck className="w-12 h-12 text-blue-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-surface-900">
                    Personnel Portal
                </h2>
                <p className="mt-2 text-center text-sm text-surface-600">
                    Authorized dispatchers and drivers only.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-surface-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {/* Show Error Message if login fails */}
                        {errorMsg && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <p className="text-sm text-red-700 font-bold">{errorMsg}</p>
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-bold text-surface-700 mb-2">
                                Official Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-surface-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-surface-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                    placeholder="driver@ambutrack.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-bold text-surface-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-surface-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-surface-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                            >
                                {isLoading ? (
                                    "Authenticating..."
                                ) : (
                                    <>
                                        Secure Login <ArrowRight className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-surface-500">
                        Need an account? <Link to="/contact" className="font-bold text-blue-600 hover:text-blue-500">Contact Hospital Admin</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;