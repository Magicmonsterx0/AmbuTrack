import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine'; // NEW: Import the routing engine

// 100% BULLETPROOF: Pure HTML/CSS marker
const createPin = (color) => new L.divIcon({
    className: 'custom-html-pin',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const patientPin = createPin('#ef4444'); // Red
const driverPin = createPin('#22c55e');  // Green

// MAGIC COMPONENT 1: Camera Panner
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

// MAGIC COMPONENT 2: The Route Drawer!
function Routing({ source, destination }) {
    const map = useMap();

    useEffect(() => {
        if (!source || !destination) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(source[0], source[1]),
                L.latLng(destination[0], destination[1])
            ],
            routeWhileDragging: false,
            addWaypoints: false, // Prevents user from dragging the line
            show: false, // Hides the ugly text instruction panel
            createMarker: () => null, // Keeps our beautiful CSS dots instead of default pins
            lineOptions: {
                styles: [{ color: '#3b82f6', weight: 5, opacity: 0.8 }] // Tailwind Blue!
            }
        }).addTo(map);

        return () => map.removeControl(routingControl);
    }, [source, destination, map]);

    return null;
}

export default function MapView({ userLocation, targetLocation, role }) {
    const defaultCenter = [28.6139, 77.2090];
    const center = userLocation || defaultCenter;

    return (
        <div className="h-full w-full bg-surface-200 flex items-center justify-center min-h-[500px] rounded-xl overflow-hidden shadow-inner z-0">
            <MapContainer center={center} zoom={13} className="h-full w-full z-0">
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater center={center} />

                {/* NEW: If we have BOTH locations, draw the blue line! */}
                {userLocation && targetLocation && (
                    <Routing source={userLocation} destination={targetLocation} />
                )}

                {userLocation && (
                    <Marker position={userLocation} icon={role === 'Patient' ? patientPin : driverPin}>
                        <Popup>You are here ({role})</Popup>
                    </Marker>
                )}

                {targetLocation && (
                    <Marker position={targetLocation} icon={role === 'Driver' ? patientPin : driverPin}>
                        <Popup>Target Location</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}