import React from 'react';
import { Link } from 'react-router-dom';
import { EVENTS, DEPARTMENTS } from '../constants';
import { Calendar, MapPin, Users, ArrowUpRight } from 'lucide-react';

import { motion } from 'framer-motion';

const Events: React.FC = () => {

  return (
    <div className="pt-24 min-h-screen bg-darker bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-dark via-darker to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 relative"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-[80px] rounded-full pointer-events-none"></div>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-4 font-mono tracking-tighter">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ARENA</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
            Choose your battleground. Compete with the best.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EVENTS.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group flex flex-col hover:shadow-[0_0_30px_rgba(255,0,85,0.15)] hover:-translate-y-2"
            >
              <div className="relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-darker to-transparent z-10 opacity-80"></div>
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-4 right-4 z-20">
                  <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur border border-primary/50 text-primary text-xs font-bold uppercase tracking-wider rounded">
                    {event.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col relative">
                <h3 className="text-2xl font-bold text-white mb-3 font-mono group-hover:text-primary transition-colors">{event.title}</h3>
                <p className="text-gray-400 text-sm mb-6 flex-1 leading-relaxed">{event.description}</p>

                <div className="space-y-3 mb-8 border-t border-white/5 pt-4">
                  <div className="flex items-center text-gray-400 text-sm">
                    <Calendar className="w-4 h-4 mr-3 text-secondary" />
                    {event.date} • {event.time}
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 mr-3 text-secondary" />
                    {event.venue}
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Users className="w-4 h-4 mr-3 text-secondary" />
                    {event.teamSize}
                  </div>
                </div>

                <Link
                  to={`/register?event=${encodeURIComponent(event.id)}`}
                  state={{ preselectedEventId: event.id }}
                  className="w-full block text-center bg-white/5 hover:bg-primary hover:text-white text-white font-bold py-3.5 rounded-xl transition-all border border-white/10 hover:border-primary group-hover:shadow-[0_0_15px_rgba(255,0,85,0.4)] flex items-center justify-center gap-2"
                >
                  REGISTER <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
