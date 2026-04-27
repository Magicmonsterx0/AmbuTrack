import { Shield, Zap, Server, MapPin } from 'lucide-react';

const About = () => {
    return (
        <div className="min-h-[calc(100vh-70px)] bg-white">
            {/* Hero Section */}
            <div className="bg-surface-50 py-20 px-6 border-b border-surface-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 mb-6">
                        Bridging the Gap Between <span className="text-red-500">Emergency</span> and <span className="text-green-500">Response</span>
                    </h1>
                    <p className="text-xl text-surface-600 leading-relaxed">
                        AmbuTrack was developed as a 6th-semester engineering initiative at IILM University, Greater Noida. Our mission is to eliminate dispatch delays using real-time geolocation and modern web architecture.
                    </p>
                </div>
            </div>

            {/* Core Values / Tech Stack */}
            <div className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-surface-900 mb-12">Powered by the MERN Stack</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="p-6 bg-surface-50 rounded-2xl border border-surface-100 text-center hover:shadow-lg transition-shadow">
                            <div className="bg-blue-100 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4">
                                <Zap className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-surface-800 mb-2">Real-Time WebSockets</h3>
                            <p className="text-surface-600 text-sm">Instant, bi-directional communication between patients and drivers with zero refresh delay.</p>
                        </div>
                        <div className="p-6 bg-surface-50 rounded-2xl border border-surface-100 text-center hover:shadow-lg transition-shadow">
                            <div className="bg-green-100 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4">
                                <MapPin className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-surface-800 mb-2">Live Routing Math</h3>
                            <p className="text-surface-600 text-sm">Offloading complex street-level pathfinding to external OSRM servers for high performance.</p>
                        </div>
                        <div className="p-6 bg-surface-50 rounded-2xl border border-surface-100 text-center hover:shadow-lg transition-shadow">
                            <div className="bg-purple-100 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4">
                                <Server className="w-7 h-7 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-surface-800 mb-2">Cloud Persistence</h3>
                            <p className="text-surface-600 text-sm">Secure MongoDB Atlas integration ensuring all fleet data and dispatch logs are permanently audited.</p>
                        </div>
                        <div className="p-6 bg-surface-50 rounded-2xl border border-surface-100 text-center hover:shadow-lg transition-shadow">
                            <div className="bg-red-100 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4">
                                <Shield className="w-7 h-7 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-surface-800 mb-2">Scalable Architecture</h3>
                            <p className="text-surface-600 text-sm">Built with React and Tailwind CSS for a modular, responsive, and robust user interface.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;