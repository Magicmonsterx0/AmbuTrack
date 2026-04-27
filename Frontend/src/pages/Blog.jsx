import { ArrowRight, Calendar } from 'lucide-react';

const Blog = () => {
    const posts = [
        {
            id: 1,
            title: "Deploying WebSockets for Zero-Latency Dispatch",
            excerpt: "How transitioning from standard HTTP polling to Socket.io reduced our ambulance dispatch delay from 5 seconds to under 50 milliseconds.",
            date: "April 15, 2026",
            category: "Engineering",
            imageColor: "bg-blue-500"
        },
        {
            id: 2,
            title: "The Importance of Immutable Dispatch Logs",
            excerpt: "Why auditing and data persistence matter in emergency medical services, and how we structured our MongoDB schemas to handle it.",
            date: "April 02, 2026",
            category: "Database",
            imageColor: "bg-green-500"
        },
        {
            id: 3,
            title: "AmbuTrack Beta Testing Phase Begins",
            excerpt: "Initial live-environment testing of the driver terminal tracking interface across the university campus.",
            date: "March 20, 2026",
            category: "Announcements",
            imageColor: "bg-orange-500"
        }
    ];

    return (
        <div className="min-h-[calc(100vh-70px)] bg-surface-50 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12 border-b border-surface-200 pb-8">
                    <h1 className="text-4xl font-extrabold text-surface-900 mb-4">Latest Updates</h1>
                    <p className="text-lg text-surface-600">Development notes, engineering deep-dives, and platform news.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <article key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-surface-200 hover:shadow-xl transition-all hover:-translate-y-1 group">
                            {/* Mock Image Area */}
                            <div className={`h-48 ${post.imageColor} relative`}>
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase text-surface-800">
                                    {post.category}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center text-surface-500 text-sm mb-3 font-medium">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {post.date}
                                </div>
                                <h2 className="text-xl font-bold text-surface-900 mb-3 group-hover:text-blue-600 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-surface-600 mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <button className="flex items-center text-blue-600 font-bold hover:text-blue-800 transition-colors">
                                    Read Article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blog;