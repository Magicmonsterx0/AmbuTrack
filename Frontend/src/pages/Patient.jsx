import { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import { socket } from '../socket';

const Patient = () => {
    const [status, setStatus] = useState('Standing by. Request a unit.');
    const [isConnected, setIsConnected] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);

    const [myLocation, setMyLocation] = useState(null);
    const [targetLocation, setTargetLocation] = useState(null); // ambulance location

    // -------------------------------------------------------------------------
    // Socket lifecycle — connect on mount, clean up on unmount
    // -------------------------------------------------------------------------
    useEffect(() => {
        socket.connect();

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('🔌 Patient socket connected:', socket.id);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            setStatus('Connection lost — reconnecting...');
        });

        // Driver accepted — we receive the driver's current location.
        // Setting targetLocation triggers MapView to draw the route line
        // from the patient's position to the ambulance's position.
        socket.on('ride-accepted', (data) => {
            setStatus('🚑 Ambulance en route to you!');
            if (data.driverLocation) {
                setTargetLocation([data.driverLocation.lat, data.driverLocation.lng]);
            }
        });

        // Driver completed the rescue
        socket.on('ride-completed', () => {
            setStatus('✅ Ride completed. Stay safe!');
            setTargetLocation(null);  // clears the route line
            setHasRequested(false);   // allow requesting again if needed
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('ride-accepted');
            socket.off('ride-completed');
            socket.disconnect();
        };
    }, []);

    // -------------------------------------------------------------------------
    // REQUEST AMBULANCE
    // Gets GPS then emits request-ambulance with socket.id as patientId.
    // The server stores socket.id in pendingRequests and uses it to route
    // the driver's acceptance back to exactly this socket.
    // -------------------------------------------------------------------------
    const handleEmergencyRequest = () => {
        if (hasRequested) return;

        setStatus('Locating GPS...');

        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser!');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setMyLocation([lat, lng]);
                setStatus('📡 Broadcasting emergency to all active units...');
                setHasRequested(true);

                socket.emit('request-ambulance', {
                    patientId: socket.id,
                    location: { lat, lng },
                });
            },
            (error) => {
                // Fallback for indoor / low-signal environments
                console.warn('GPS failed, using fallback:', error.message);
                const lat = 28.4597;
                const lng = 77.4954;

                setMyLocation([lat, lng]);
                setStatus('📡 Broadcasting emergency (estimated location)...');
                setHasRequested(true);

                socket.emit('request-ambulance', {
                    patientId: socket.id,
                    location: { lat, lng },
                });
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-70px)] w-full">

            <aside className="w-full md:w-96 p-6 border-r border-surface-200 flex flex-col bg-white shadow-xl z-10">
                <h2 className="text-2xl font-bold mb-6 text-patient-600">Patient Portal</h2>

                <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`} />
                    <span className="text-xs text-surface-500 font-medium">
                        {isConnected ? 'Server connected' : 'Connecting to server...'}
                    </span>
                </div>

                <div className={`bg-blue-50 p-4 rounded-xl mb-6 border shadow-inner ${targetLocation ? 'border-green-400 bg-green-50' : 'border-blue-200'}`}>
                    <h3 className="text-xs font-bold text-blue-400 uppercase mb-2">Live Status</h3>
                    <p className={`font-medium ${targetLocation ? 'text-green-700 animate-pulse' : 'text-blue-800'}`}>
                        {status}
                    </p>
                </div>

                <button
                    onClick={handleEmergencyRequest}
                    disabled={hasRequested || !isConnected}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-transform active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {hasRequested ? '🔴 Request Sent — Awaiting Unit' : 'Request Ambulance'}
                </button>

                {/* Cancel while waiting, before a driver accepts */}
                {hasRequested && !targetLocation && (
                    <button
                        onClick={() => {
                            setHasRequested(false);
                            setStatus('Standing by. Request a unit.');
                        }}
                        className="mt-3 w-full text-sm text-surface-500 hover:text-red-500 font-medium py-2 rounded-xl transition-colors"
                    >
                        Cancel Request
                    </button>
                )}
            </aside>

            <main className="grow relative p-4 z-0 bg-green-200">
                {/*
                    userLocation = patient's red pin
                    targetLocation = ambulance's green pin
                    MapView draws a route line between them when both are set
                */}
                <MapView role="Patient" userLocation={myLocation} targetLocation={targetLocation} />
            </main>
        </div>
    );
};

export default Patient;