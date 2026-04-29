import { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import { socket } from '../socket';

const Patient = () => {
    const [status, setStatus] = useState('Standing by. Request a unit.');
    const [isConnected, setIsConnected] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);

    // myLocation = where the patient is (red pin on map)
    // targetLocation = where the ambulance is (green pin + route line source)
    const [myLocation, setMyLocation] = useState(null);
    const [targetLocation, setTargetLocation] = useState(null);

    // -------------------------------------------------------------------------
    // Socket lifecycle — connect on mount, clean up on unmount.
    // FIX: socket.connect() is called here explicitly because autoConnect:false
    // in socket.js. Without this, no socket events are ever received.
    // FIX: ride-accepted and ride-completed listeners are registered here, not
    // in a separate useEffect, so they always have access to the latest state.
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

        // -----------------------------------------------------------------------
        // DRIVER ACCEPTED THE RIDE
        // FIX: The original code used socket.id as patientId in request-ambulance
        // and the server did io.to(patientId) which didn't reliably work.
        // Now server uses socket.to(patientId) and this listener fires correctly.
        // We receive the driver's current location and draw the route on the map.
        // -----------------------------------------------------------------------
        socket.on('ride-accepted', (data) => {
            setStatus('🚑 Ambulance en route to you!');

            // data.driverLocation is { lat, lng } — convert to [lat, lng] for Leaflet
            if (data.driverLocation) {
                setTargetLocation([data.driverLocation.lat, data.driverLocation.lng]);
            }
        });

        // Driver has dropped off the patient
        socket.on('ride-completed', () => {
            setStatus('✅ Ride completed. Stay safe!');
            setTargetLocation(null);  // clears the route line from the map
            setHasRequested(false);   // allow requesting again
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
    // Gets GPS location then emits request-ambulance to the server.
    // The server stores socket.id server-side and broadcasts to active drivers.
    // FIX: patientId is socket.id (set at emit time, not cached before connect).
    // -------------------------------------------------------------------------
    const handleEmergencyRequest = () => {
        if (hasRequested) return; // prevent double-tapping

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

                // FIX: socket.id is the patientId the server and driver will use
                // to route the ride-accepted event back to THIS exact socket.
                socket.emit('request-ambulance', {
                    patientId: socket.id,
                    location: { lat, lng },
                });
            },
            (error) => {
                // GPS failed (common indoors) — use fallback coords so the demo still works
                console.warn('Real GPS failed, using fallback:', error.message);

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
            {
                enableHighAccuracy: true,
                timeout: 5000,
            }
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-70px)] w-full">

            {/* ----------------------------------------------------------------
                LEFT PANEL — Status & request button (visuals unchanged)
            ---------------------------------------------------------------- */}
            <aside className="w-full md:w-96 p-6 border-r border-surface-200 flex flex-col bg-white shadow-xl z-10">
                <h2 className="text-2xl font-bold mb-6 text-patient-600">Patient Portal</h2>

                {/* Connection indicator */}
                <div className="flex items-center gap-2 mb-4">
                    <span
                        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}
                    />
                    <span className="text-xs text-surface-500 font-medium">
                        {isConnected ? 'Server connected' : 'Connecting to server...'}
                    </span>
                </div>

                {/* Status box */}
                <div
                    className={`bg-blue-50 p-4 rounded-xl mb-6 border shadow-inner ${
                        targetLocation ? 'border-green-400 bg-green-50' : 'border-blue-200'
                    }`}
                >
                    <h3 className="text-xs font-bold text-blue-400 uppercase mb-2">Live Status</h3>
                    <p
                        className={`font-medium ${
                            targetLocation ? 'text-green-700 animate-pulse' : 'text-blue-800'
                        }`}
                    >
                        {status}
                    </p>
                </div>

                {/* Request button — disabled after first tap until ride completes */}
                <button
                    onClick={handleEmergencyRequest}
                    disabled={hasRequested || !isConnected}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-transform active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {hasRequested ? '🔴 Request Sent — Awaiting Unit' : 'Request Ambulance'}
                </button>

                {/* Show cancel option once request is sent but not yet accepted */}
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

            {/* ----------------------------------------------------------------
                MAP — route line draws from patient → ambulance when accepted
            ---------------------------------------------------------------- */}
            <main className="grow relative p-4 z-0 bg-green-200">
                {/*
                    userLocation = patient's red pin
                    targetLocation = driver's green pin + route line drawn between them
                */}
                <MapView role="Patient" userLocation={myLocation} targetLocation={targetLocation} />
            </main>
        </div>
    );
};

export default Patient;