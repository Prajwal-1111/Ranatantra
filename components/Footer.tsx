import { Instagram, Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 shadow-[0_0_20px_rgba(255,0,85,1)]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-12">

          {/* Brand Info */}
          <div>
            <div className="mb-6 flex items-center gap-4">
              <img
                src="/jgi-logo.png"
                alt="JGI Logo"
                className="h-12 md:h-14 w-auto object-contain"
              />
              <img
                src="/logo.png"
                alt="Ranatantra Logo"
                className="h-16 md:h-20 w-auto object-contain"
              />
            </div>
            <p className="text-gray-500 mb-6 max-w-sm text-sm">
              <span className="text-white font-bold text-base block mb-2">Jain College of Engineering & Technology Hubballi</span>
              Join us for a thrilling college event filled with non-stop fun, excitement, and unforgettable memories! Get ready for games, music, and laughter with friends. Don't miss out on the ultimate campus experience! 🎉🎶🔥
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/jcetmba?igsh=NGppZnAwZnoxcTZj&utm_source=qr" target="_blank" rel="noopener noreferrer" className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-primary transition-all" title="Follow us on Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="#/events" className="text-gray-500 hover:text-secondary transition-colors hover:pl-2 inline-block py-2">All Events</a></li>
              <li><a href="#/schedule" className="text-gray-500 hover:text-secondary transition-colors hover:pl-2 inline-block py-2">Event Schedule</a></li>
              <li><a href="#/register" className="text-gray-500 hover:text-secondary transition-colors hover:pl-2 inline-block py-2">Registration</a></li>
              <li><a href="#/contact" className="text-gray-500 hover:text-secondary transition-colors hover:pl-2 inline-block py-2">Contact Support</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Contact Us</h4>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
                <span className="text-gray-500">
                  Jain College of Engineering & Technology Hubballi
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-gray-500">
                  +91-7795341351
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:vishal.ishwar.ponaji@gmail.com" className="text-gray-500 hover:text-white transition-colors inline-block py-2">
                  vishal.ishwar.ponaji@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col items-center md:flex-row md:justify-between gap-4 text-center md:text-left">
          <p className="text-gray-600 text-xs flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span>© 2026 Ranatantra. All rights reserved.</span>
            <span className="hidden sm:inline">|</span>
            <span className="text-sm font-medium text-gray-500">
              Developed and designed by <a href="https://www.linkedin.com/in/srujanmirji/" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white transition-colors">Srujan Mirji</a>
            </span>
          </p>
          <div className="flex gap-6 text-xs text-gray-600">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;