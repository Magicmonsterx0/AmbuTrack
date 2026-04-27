import { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import { socket } from '../socket';

const Driver = () => {
    const [status, setStatus] = useState("Offline");
    const [incomingRide, setIncomingRide] = useState(null);
    const [isOnline, setIsOnline] = useState(false);

    // State to hold the GPS coordinates for the map
    const [myLocation, setMyLocation] = useState(null);
    const [targetLocation, setTargetLocation] = useState(null);
    const [activePatientId, setActivePatientId] = useState(null);

    // Extract dynamic data from the secure login session
    const plateNumber = localStorage.getItem('plateNumber');
    const driverName = localStorage.getItem('driverName');

    useEffect(() => {
        // Listen for the targeted dispatch from the backend
        socket.on('incoming-ride', (data) => {
            setIncomingRide(data);
            setStatus("🚨 INCOMING DISPATCH 🚨");
        });

        return () => socket.off('incoming-ride');
    }, []);

    const handleGoOnline = () => {
        setStatus("Locating GPS satellites...");

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser!");
            return;
        }

        // watchPosition tracks the device continuously
        const id = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setMyLocation([lat, lng]);
                setIsOnline(true);
                setStatus("Online - Transmitting Live GPS");

                // Broadcast live location through the secure tunnel
                socket.emit('go-online', {
                    driverId: socket.id,
                    plateNumber: localStorage.getItem('plateNumber'),
                    location: { lat, lng },
                    token: localStorage.getItem('token')
                });
            },
            (error) => {
                console.error("GPS Error:", error);
                setStatus("Error: Could not lock GPS signal.");
                // 💡 Pro-tip: Indoor GPS often fails. You might want a manual fallback here!
            },
            {
                enableHighAccuracy: true, // Forces device to use GPS chip, not just Wi-Fi
                maximumAge: 0,
                timeout: 10000 // 10 seconds to find a signal
            }
        );

        setWatchId(id); // Save the ID so we can stop tracking when they go offline
    };

    const acceptRide = () => {
        setStatus("En route to patient!");
        setTargetLocation([incomingRide.location.lat, incomingRide.location.lng]);
        setActivePatientId(incomingRide.patientId); // Save who we are rescuing

        // TELL THE SERVER WE ACCEPTED!
        socket.emit('accept-ride', {
            patientId: incomingRide.patientId,
            driverLocation: myLocation
        });

        setIncomingRide(null);
    };

    const completeRide = () => {
        socket.emit('complete-ride', {
            patientId: activePatientId,
            plateNumber,
            pickupLocation: { lat: targetLocation[0], lng: targetLocation[1] },
            token: localStorage.getItem('token') // 🔒 Make sure this line is here!
        });

        setStatus("Online - Awaiting Dispatch");
        setTargetLocation(null);
        setActivePatientId(null);
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-70px)] relative">

            {/* RAPIDO-STYLE POPUP MODAL */}
            {incomingRide && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-bounce">
                        <h2 className="text-3xl font-extrabold text-red-600 mb-2">🚨 EMERGENCY DISPATCH</h2>
                        <p className="text-surface-600 mb-6 font-medium">Patient requesting immediate evac. Coordinates attached.</p>
                        <div className="flex gap-4">
                            <button onClick={acceptRide} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">
                                ACCEPT ROUTE
                            </button>
                            <button onClick={() => setIncomingRide(null)} className="flex-1 bg-surface-200 text-surface-800 font-bold py-3 rounded-xl hover:bg-surface-300">
                                DECLINE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <aside className="w-full md:w-96 p-6 border-r border-surface-200 flex flex-col bg-white shadow-xl z-10">
                <h2 className="text-3xl font-extrabold text-surface-900 mb-2">
                    Welcome, {driverName || 'Driver'}
                </h2>
                <p className="text-surface-600 mb-6 font-medium">
                    Assigned Vehicle: <span className="text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded-md">{plateNumber || 'Unknown'}</span>
                </p>

                <div className="bg-surface-50 p-4 rounded-xl mb-6 border border-surface-200 shadow-inner">
                    <h3 className="text-xs font-bold uppercase mb-2 text-surface-500">Dispatch Status</h3>
                    <p className={`font-medium ${incomingRide ? 'text-red-600 animate-pulse' : 'text-surface-800'}`}>{status}</p>
                </div>

                {!isOnline ? (
                    <button onClick={handleGoOnline} className="w-full font-bold py-4 rounded-xl text-white bg-green-600 hover:bg-green-700 transition-transform active:scale-95 shadow-lg">
                        Go Online (Broadcast GPS)
                    </button>
                ) : targetLocation ? (
                    <button onClick={completeRide} className="w-full font-bold py-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95 shadow-lg animate-pulse">
                        Complete Rescue (Drop off)
                    </button>
                ) : (
                    <div className="w-full font-bold py-4 rounded-xl text-green-700 bg-green-100 border border-green-300 text-center">
                        Active & Monitoring
                    </div>
                )}
            </aside>

            <main className="grow relative p-4 z-0">
                <MapView role="Driver" userLocation={myLocation} targetLocation={targetLocation} />
            </main>
        </div>
    );
};

export default Driver;