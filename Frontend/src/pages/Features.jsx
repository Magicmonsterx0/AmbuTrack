import { Activity, Map, Clock, Database, ShieldCheck, Smartphone } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <Activity className="w-8 h-8 text-blue-500" />,
            title: "Real-Time WebSockets",
            description: "Powered by Socket.io, our platform bypasses standard HTTP polling to deliver instant, bi-directional GPS updates between patients and emergency responders."
        },
        {
            icon: <Map className="w-8 h-8 text-green-500" />,
            title: "Smart Route Optimization",
            description: "Integrated with Leaflet and external OSRM servers to dynamically calculate the fastest street-level paths without overloading the client device."
        },
        {
            icon: <Database className="w-8 h-8 text-purple-500" />,
            title: "Immutable Dispatch Logs",
            description: "Every accepted and completed rescue is permanently written to a secure MongoDB Atlas cloud database for hospital auditing and fleet tracking."
        },
        {
            icon: <Clock className="w-8 h-8 text-orange-500" />,
            title: "Sub-Second Latency",
            description: "By keeping map renders pure and utilizing targeted multicast rooms on the backend, dispatch alerts reach available drivers in under 50 milliseconds."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-red-500" />,
            title: "Enterprise Reliability",
            description: "Built on the MERN stack (MongoDB, Express, React, Node.js) ensuring a scalable, decoupled architecture ready for production deployment."
        },
        {
            icon: <Smartphone className="w-8 h-8 text-teal-500" />,
            title: "Responsive UI",
            description: "Constructed with Tailwind CSS to guarantee the driver terminal and patient portals remain highly functional across both desktop and mobile devices."
        }
    ];

    return (
        <div className="min-h-[calc(100vh-70px)] bg-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 mb-4">
                        System <span className="text-blue-600">Features</span>
                    </h1>
                    <p className="text-lg text-surface-600 max-w-2xl mx-auto">
                        AmbuTrack combines real-time networking with modern web mapping to create a highly efficient emergency dispatch engine.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-surface-50 border border-transparent hover:border-surface-200 transition-all duration-300">
                            <div className="bg-surface-100 p-4 rounded-2xl mb-6 shadow-sm">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-surface-900 mb-3">{feature.title}</h3>
                            <p className="text-surface-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;