import { useState, useEffect, useRef } from 'react';
import MapView from '../components/MapView';
import { socket } from '../socket';

const Driver = () => {
    const [status, setStatus] = useState('Offline');
    const [incomingRide, setIncomingRide] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const [myLocation, setMyLocation] = useState(null);
    const [targetLocation, setTargetLocation] = useState(null);
    const [activePatientId, setActivePatientId] = useState(null);

    // Ref so clearing the GPS watch doesn't cause a re-render
    const watchIdRef = useRef(null);
    // Prevents go-online from emitting on every GPS tick — fires only once
    const sentOnlineRef = useRef(false);

    const plateNumber = localStorage.getItem('plateNumber');
    const driverName = localStorage.getItem('driverName');
    const token = localStorage.getItem('token');

    // -------------------------------------------------------------------------
    // Socket lifecycle
    // -------------------------------------------------------------------------
    useEffect(() => {
        socket.connect();

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('🔌 Driver socket connected:', socket.id);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            setIsOnline(false);
            sentOnlineRef.current = false;
            setStatus('Disconnected — reconnecting...');
        });

        socket.on('auth-error', (data) => {
            alert(`Security error: ${data.message}. Please log in again.`);
        });

        socket.on('incoming-ride', (data) => {
            setIncomingRide(data);
            setStatus('🚨 INCOMING DISPATCH 🚨');
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('auth-error');
            socket.off('incoming-ride');
            socket.disconnect();
            stopGPS();
        };
    }, []);

    // -------------------------------------------------------------------------
    // Stop GPS helper — called by Go Offline and on unmount
    // -------------------------------------------------------------------------
    const stopGPS = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    // -------------------------------------------------------------------------
    // GO ONLINE
    // First GPS fix → emit go-online (join room, write to DB, verify JWT once)
    // Every subsequent fix → emit update-location (no JWT, just DB update)
    //
    // myLocation is updated on EVERY tick so the map marker moves in real time.
    // When targetLocation is also set (en route to patient), MapView's Routing
    // component receives the new source coordinate and redraws the route line.
    // -------------------------------------------------------------------------
    const handleGoOnline = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser!');
            return;
        }

        setStatus('Locating GPS satellites...');

        const id = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Update the map marker on every single tick (real-time movement)
                setMyLocation([lat, lng]);

                if (!sentOnlineRef.current) {
                    // First lock — register with server
                    sentOnlineRef.current = true;
                    setIsOnline(true);
                    setStatus('Online — Monitoring for emergencies');
                    socket.emit('go-online', { plateNumber, location: { lat, lng }, token });
                } else {
                    // Every subsequent tick — just update DB location
                    socket.emit('update-location', { plateNumber, location: { lat, lng } });
                }
            },
            (error) => {
                console.error('GPS Error:', error);
                setStatus('Error: Could not lock GPS signal.');
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );

        watchIdRef.current = id;
    };

    // -------------------------------------------------------------------------
    // GO OFFLINE — explicit button click while online and not on a rescue
    // Stops GPS, emits go-offline so server leaves the room + marks DB Offline
    // -------------------------------------------------------------------------
    const handleGoOffline = () => {
        stopGPS();
        sentOnlineRef.current = false;
        setIsOnline(false);
        setMyLocation(null);
        setStatus('Offline');

        socket.emit('go-offline', { plateNumber, token });
    };

    // -------------------------------------------------------------------------
    // ACCEPT RIDE
    // Sets targetLocation → MapView immediately draws the route to the patient.
    // As myLocation updates (driver moves), the route redraws automatically.
    // -------------------------------------------------------------------------
    const acceptRide = () => {
        if (!incomingRide) return;

        setStatus('En route to patient!');
        setTargetLocation([incomingRide.location.lat, incomingRide.location.lng]);
        setActivePatientId(incomingRide.patientId);

        socket.emit('accept-ride', {
            patientId: incomingRide.patientId,
            driverLocation: myLocation ? { lat: myLocation[0], lng: myLocation[1] } : null,
            token,
        });

        setIncomingRide(null);
    };

    // -------------------------------------------------------------------------
    // COMPLETE RIDE
    // -------------------------------------------------------------------------
    const completeRide = () => {
        socket.emit('complete-ride', {
            patientId: activePatientId,
            plateNumber,
            pickupLocation: targetLocation
                ? { lat: targetLocation[0], lng: targetLocation[1] }
                : { lat: 0, lng: 0 },
            token,
        });

        setStatus('Online — Monitoring for emergencies');
        setTargetLocation(null);
        setActivePatientId(null);
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-70px)] relative">

            {/* ----------------------------------------------------------------
                RAPIDO-STYLE BOTTOM SHEET
            ---------------------------------------------------------------- */}
            {incomingRide && (
                <>
                    <div className="absolute inset-0 bg-black/50 z-40" />
                    <div
                        className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl px-6 pt-4 pb-10"
                        style={{ animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
                    >
                        <div className="w-10 h-1 bg-surface-300 rounded-full mx-auto mb-5" />
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">🚨</span>
                            <h2 className="text-xl font-extrabold text-red-600 tracking-tight">
                                Emergency Dispatch
                            </h2>
                        </div>
                        <p className="text-sm text-surface-500 mb-5 pl-9">
                            Patient is requesting immediate assistance.
                        </p>
                        <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                            <span className="text-lg mt-0.5">📍</span>
                            <div>
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">
                                    Patient Coordinates
                                </p>
                                <p className="text-sm font-mono font-medium text-surface-700">
                                    {incomingRide.location.lat.toFixed(5)},&nbsp;
                                    {incomingRide.location.lng.toFixed(5)}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={acceptRide}
                                className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg text-base"
                            >
                                ✅ Accept Route
                            </button>
                            <button
                                onClick={() => {
                                    setIncomingRide(null);
                                    setStatus('Online — Monitoring for emergencies');
                                }}
                                className="flex-1 bg-surface-100 hover:bg-surface-200 active:scale-95 text-surface-700 font-bold py-4 rounded-2xl transition-all text-base"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                    <style>{`
                        @keyframes slideUp {
                            from { transform: translateY(100%); }
                            to   { transform: translateY(0); }
                        }
                    `}</style>
                </>
            )}

            {/* ----------------------------------------------------------------
                LEFT PANEL
            ---------------------------------------------------------------- */}
            <aside className="w-full md:w-96 p-6 border-r border-surface-200 flex flex-col bg-white shadow-xl z-10">
                <h2 className="text-3xl font-extrabold text-surface-900 mb-2">
                    Welcome, {driverName || 'Driver'}
                </h2>
                <p className="text-surface-600 mb-4 font-medium">
                    Assigned Vehicle:{' '}
                    <span className="text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded-md">
                        {plateNumber || 'Unknown'}
                    </span>
                </p>

                <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`} />
                    <span className="text-xs text-surface-500 font-medium">
                        {isConnected ? 'Server connected' : 'Connecting to server...'}
                    </span>
                </div>

                <div className="bg-surface-50 p-4 rounded-xl mb-6 border border-surface-200 shadow-inner">
                    <h3 className="text-xs font-bold uppercase mb-2 text-surface-500">Dispatch Status</h3>
                    <p className={`font-medium ${incomingRide ? 'text-red-600 animate-pulse' : 'text-surface-800'}`}>
                        {status}
                    </p>
                </div>

                {!isOnline ? (
                    // OFFLINE STATE — go online button
                    <button
                        onClick={handleGoOnline}
                        disabled={!isConnected}
                        className="w-full font-bold py-4 rounded-xl text-white bg-green-600 hover:bg-green-700 transition-transform active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Go Online (Broadcast GPS)
                    </button>
                ) : targetLocation ? (
                    // EN ROUTE STATE — complete rescue button
                    <button
                        onClick={completeRide}
                        className="w-full font-bold py-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95 shadow-lg animate-pulse"
                    >
                        Complete Rescue (Drop off)
                    </button>
                ) : (
                    // ONLINE & WAITING STATE — status chip + go offline button
                    <div className="flex flex-col gap-3">
                        <div className="w-full font-bold py-4 rounded-xl text-green-700 bg-green-100 border border-green-300 text-center">
                            Active &amp; Monitoring
                        </div>
                        {/* GO OFFLINE — was completely missing before */}
                        <button
                            onClick={handleGoOffline}
                            className="w-full font-bold py-3 rounded-xl text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-transform active:scale-95"
                        >
                            Go Offline
                        </button>
                    </div>
                )}
            </aside>

            {/* ----------------------------------------------------------------
                MAP
                myLocation updates every GPS tick → green pin moves in real time.
                targetLocation = patient's fixed pickup point (red pin).
                MapView's Routing component receives the updated source on every
                render and redraws the road route — so the line follows the driver.
            ---------------------------------------------------------------- */}
            <main className="grow relative p-4 z-0">
                <MapView role="Driver" userLocation={myLocation} targetLocation={targetLocation} />
            </main>
        </div>
    );
};

export default Driver;