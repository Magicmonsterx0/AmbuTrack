import { ShieldAlert, PhoneCall, HeartPulse, Activity } from 'lucide-react'; // Make sure to run: npm install lucide-react

const EmergencyGuide = () => {
    const guides = [
        {
            title: "Cardiac Arrest (CPR)",
            icon: <HeartPulse className="w-8 h-8 text-red-500" />,
            steps: [
                "Call for an ambulance immediately.",
                "Lay the person flat on their back.",
                "Begin chest compressions: push hard and fast in the center of the chest.",
                "Do not stop until help arrives."
            ]
        },
        {
            title: "Severe Bleeding",
            icon: <Activity className="w-8 h-8 text-red-500" />,
            steps: [
                "Apply direct pressure to the wound with a clean cloth.",
                "Maintain pressure continuously.",
                "If possible, elevate the injured area above the heart.",
                "Do not remove the cloth; add more layers if blood soaks through."
            ]
        },
        {
            title: "Choking",
            icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
            steps: [
                "Ask 'Are you choking?' If they cannot cough or speak, act immediately.",
                "Stand behind them and give 5 back blows between the shoulder blades.",
                "Give 5 abdominal thrusts (Heimlich maneuver).",
                "Alternate until the blockage is cleared."
            ]
        }
    ];

    return (
        <div className="min-h-[calc(100vh-70px)] bg-surface-50 py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 mb-4">
                        First Aid & Emergency Guide
                    </h1>
                    <p className="text-lg text-surface-600 max-w-2xl mx-auto">
                        While AmbuTrack units are en route, taking immediate action can save a life. Follow these basic protocols until professionals arrive.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {guides.map((guide, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-lg border border-surface-200 p-8 hover:shadow-xl transition-shadow">
                            <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
                                {guide.icon}
                            </div>
                            <h2 className="text-2xl font-bold text-surface-800 mb-4">{guide.title}</h2>
                            <ul className="space-y-3">
                                {guide.steps.map((step, i) => (
                                    <li key={i} className="flex items-start text-surface-600">
                                        <span className="text-red-500 font-bold mr-2">{i + 1}.</span>
                                        <span className="leading-relaxed">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-blue-600 rounded-3xl p-8 md:p-12 text-center shadow-2xl flex flex-col md:flex-row items-center justify-between">
                    <div className="text-left mb-6 md:mb-0">
                        <h3 className="text-2xl font-bold text-white mb-2">Need immediate assistance?</h3>
                        <p className="text-blue-100">Our dispatch servers are monitoring your area 24/7.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg active:scale-95">
                        <PhoneCall className="w-5 h-5" />
                        Request Ambulance Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyGuide;