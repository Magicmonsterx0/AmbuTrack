import { Link } from 'react-router-dom';
import { Siren, Activity, ArrowRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="min-h-[calc(100vh-70px)] bg-surface-50 flex flex-col items-center justify-center relative overflow-hidden">

            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="max-w-5xl mx-auto px-6 text-center z-10 relative">

                {/* Hero Text */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 font-bold text-sm mb-8 border border-red-200">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Live Dispatch Servers Online
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-surface-900 mb-6 tracking-tight">
                    Next-Generation <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                        Emergency Response
                    </span>
                </h1>

                <p className="text-xl text-surface-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                    AmbuTrack eliminates dispatch delays using real-time WebSockets and smart geolocation, connecting patients to the nearest active units in milliseconds.
                </p>

                {/* Call to Action Portals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

                    {/* Patient Portal Button */}
                    <Link to="/patient" className="group relative bg-white p-8 rounded-3xl shadow-xl border border-surface-200 hover:border-red-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                        <Activity className="w-12 h-12 text-red-500 mb-6" />
                        <h2 className="text-2xl font-bold text-surface-900 mb-2">Patient Portal</h2>
                        <p className="text-surface-600 mb-6">Broadcast an emergency beacon and track your assigned ambulance in real-time.</p>
                        <div className="flex items-center text-red-600 font-bold group-hover:text-red-700">
                            Enter Portal <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </Link>

                    {/* Driver Portal Button */}
                    <Link to="/driver" className="group relative bg-white p-8 rounded-3xl shadow-xl border border-surface-200 hover:border-green-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                        <Siren className="w-12 h-12 text-green-500 mb-6" />
                        <h2 className="text-2xl font-bold text-surface-900 mb-2">Driver Terminal</h2>
                        <p className="text-surface-600 mb-6">Go online to receive instant dispatch alerts and optimized navigation routes.</p>
                        <div className="flex items-center text-green-600 font-bold group-hover:text-green-700">
                            Enter Terminal <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
};

export default Home;