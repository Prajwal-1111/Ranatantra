import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen bg-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 md:mb-16 text-center font-mono">
          GET IN <span className="text-primary">TOUCH</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-card/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6">Support Channels</h3>
              <p className="text-gray-400 mb-8">
                Questions? Our communications are open Mon to Fri 9am to 6pm.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Venue:</h4>
                    <p className="text-gray-400 text-sm">Jain College of Engineering & Technology Hubballi</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 group-hover:border-secondary/50 group-hover:bg-secondary/20 transition-all">
                    <Mail className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Email:</h4>
                    <p className="text-gray-400 text-sm">vishal.ishwar.ponaji@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 group-hover:border-tertiary/50 group-hover:bg-tertiary/20 transition-all">
                    <Phone className="w-6 h-6 text-tertiary" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Phone:</h4>
                    <p className="text-gray-400 text-sm">+91-7795341351</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Event Date:</h4>
                    <p className="text-gray-400 text-sm">March 27, 0900 - 1800 HRS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-darker rounded-2xl border border-white/10 overflow-hidden h-96 md:h-auto relative group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            {/* Simulating a map */}

            <iframe
              title="map"
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4592.973082900363!2d75.117591!3d15.393939!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb8d0e7c892f329%3A0x437f4bb22c9d71b6!2sJain%20College%20of%20Engineering%20%26%20Technology%20Hubballi!5e1!3m2!1sen!2sin!4v1771345275313!5m2!1sen!2sin"
              className="w-full h-full transition-all duration-700"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
