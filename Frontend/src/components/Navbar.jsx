import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Moon } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path? "border-b-2 border-zinc-900 " : "text-zinc-500 hover:text-zinc-900";
    };

    return (
        <nav className="w-full bg-orange-400 border-b border-zinc-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
            {/* Logo */}
            <Link to = "/" className = "text-3xl font-extrabold tracking-tight text-zinc-950">
                Ambu<span className="text-green-600">Track</span>
            </Link>

            {/*Navigation Links*/}
            <div className="hidden md:flex gap-8 text-sm font-medium">
                <Link to="/features" className={isActive('/features')}>FEATURES</Link>
                <Link to="/about" className={isActive('/about')}>ABOUT US</Link>
                <Link to="/fleet" className={isActive('/fleet')}>FLEET INFO</Link>
                <Link to="/emergency" className={isActive('/emergency')}>EMERGENCY GUIDE</Link>
                <Link to="/blog" className={isActive('/blog')}>BLOG</Link>
            </div>

            {/*icons*/}
            <div className="flex items-center gap-4 text-zinc-600">
                <button className="hover:text-green-500 transition-colors">
                    <Bell size={20} />
                </button>
                <Link to="/login" className="p-2 hover:bg-orange-600 rounded-full transition-colors hidden sm:block">
                    <User className="w-5 h-5" />
                </Link>
                {/*toggel theme here*/}
                <button className="p-2 rounded-full border-zinc-200 hover:bg-zinc-100 transition-colors">
                    <Moon size={18} />
                </button>
            </div>
        </nav>
    );
}

export default Navbar;