import { useState, useEffect } from 'react';
import axios from 'axios';

const Fleet = () => {
    const [fleet, setFleet] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch the data from your Node.js API when the page loads
        const fetchFleet = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/fleet`);
                setFleet(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching fleet:", err);
                setError("Failed to load fleet data. Is the backend running?");
                setLoading(false);
            }
        };

        fetchFleet();
    }, []);

    // Helper function for color-coded status badges
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Online': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">🟢 Online</span>;
            case 'Offline': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">⚪ Offline</span>;
            case 'Dispatched': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">🔵 Dispatched</span>;
            case 'Maintenance': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">🔴 Maintenance</span>;
            default: return status;
        }
    };

    return (
        <div className="min-h-[calc(100vh-70px)] bg-surface-100 p-8">
            <div className="max-w-6xl mx-auto">

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-surface-900">Fleet Management</h1>
                        <p className="text-surface-500 mt-1">Live overview of all registered emergency vehicles.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow border border-surface-200">
                        <span className="text-sm font-bold text-surface-500 uppercase">Total Units: </span>
                        <span className="text-lg font-extrabold text-responder-600">{fleet.length}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-surface-500 font-medium animate-pulse">Establishing secure connection to fleet database...</div>
                ) : error ? (
                    <div className="bg-red-100 text-red-700 p-4 rounded-xl border border-red-300 font-medium text-center">{error}</div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-surface-50 border-b border-surface-200">
                                <th className="p-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Plate Number</th>
                                <th className="p-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Driver / Paramedic</th>
                                <th className="p-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Live Status</th>
                                <th className="p-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Last Known GPS</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100">
                            {fleet.map((vehicle) => (
                                <tr key={vehicle._id} className="hover:bg-surface-50 transition-colors">
                                    <td className="p-4 font-bold text-surface-800">{vehicle.plateNumber}</td>
                                    <td className="p-4 font-medium text-surface-600">{vehicle.driverName}</td>
                                    <td className="p-4">{getStatusBadge(vehicle.status)}</td>
                                    <td className="p-4 font-mono text-sm text-surface-500">
                                        {vehicle.currentLocation.lat.toFixed(4)}, {vehicle.currentLocation.lng.toFixed(4)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {fleet.length === 0 && (
                            <div className="text-center py-12 text-surface-500 font-medium">No vehicles found in the database.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Fleet;