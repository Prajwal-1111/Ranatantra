import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Events from './pages/Events';
import Schedule from './pages/Schedule';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import SeoManager from './components/SeoManager';
import { getStoredAuthUser } from './services/authSession';
import { getRegistrations } from './services/googleSheets';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  React.useEffect(() => {
    const storedUser = getStoredAuthUser();
    if (!storedUser?.email) {
      return;
    }

    // Warm dashboard cache in the background to reduce perceived load time on first open.
    getRegistrations(storedUser.email).catch((error) => {
      console.warn('Dashboard prefetch failed:', error);
    });
  }, []);

  return (
    <Router>
      <SeoManager />
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-dark text-white">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<Navigate to="/gallery" replace />} />
            <Route path="/events" element={<Events />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
