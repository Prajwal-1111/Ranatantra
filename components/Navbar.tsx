import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AUTH_CHANGED_EVENT, getStoredAuthUser } from '../services/authSession';
import { ADMIN_ALLOWED_EMAILS } from '../constants';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    const updateAuthState = () => {
      const user = getStoredAuthUser();
      setIsLoggedIn(!!user);

      const normalizedAllowed = ADMIN_ALLOWED_EMAILS.map((email) => email.trim().toLowerCase());
      const normalizedUserEmail = (user?.email || '').trim().toLowerCase();
      setIsAdmin(!!normalizedUserEmail && normalizedAllowed.includes(normalizedUserEmail));
    };

    updateAuthState();
    window.addEventListener(AUTH_CHANGED_EVENT, updateAuthState);
    window.addEventListener('storage', updateAuthState);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, updateAuthState);
      window.removeEventListener('storage', updateAuthState);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Contact', path: '/contact' },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  const actionLink = isLoggedIn
    ? { path: '/dashboard', label: 'DASHBOARD', mobileLabel: 'Dashboard' }
    : { path: '/register', label: 'REGISTER', mobileLabel: 'Register Now' };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-darker/90 backdrop-blur-xl border-b border-primary/20 py-2 md:py-3' : 'bg-transparent py-3 md:py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="hidden xs:inline text-xl sm:text-2xl font-bold font-mono tracking-tighter text-white">
              Rana<span className="text-primary text-glow">tantra</span>
            </span>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:text-secondary ${isActive ? 'text-secondary drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]' : 'text-gray-400'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <NavLink
              to={actionLink.path}
              className="min-h-[44px] inline-flex items-center justify-center bg-primary hover:bg-white hover:text-primary text-white font-bold py-2 px-6 rounded-none skew-x-[-10deg] transition-all transform hover:scale-105 shadow-[0_0_10px_rgba(255,0,85,0.4)]"
            >
              <span className="skew-x-[10deg]">{actionLink.label}</span>
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -mr-2 text-white hover:text-primary focus:outline-none transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden absolute w-full h-screen overflow-y-auto bg-transparent backdrop-blur-md border-b border-primary/20 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `block px-3 py-3 rounded-md text-base font-bold uppercase tracking-wider ${isActive ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <NavLink
            to={actionLink.path}
            className="block w-full text-center mt-4 bg-primary text-white font-bold py-3 uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,85,0.4)]"
          >
            {actionLink.mobileLabel}
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
