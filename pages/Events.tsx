import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EVENTS, DEPARTMENTS } from '../constants';
import { Calendar, MapPin, Users, ArrowUpRight, Download, Info, X, ShieldCheck, Phone } from 'lucide-react';
import { EventDetails } from '../types';

import { motion } from 'framer-motion';
import TiltCard from '../components/TiltCard';

const Events: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);

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
          <h1 className="text-3xl md:text-7xl font-black text-white mb-4 font-mono tracking-tighter">
            <span className="sr-only">Ranatantra 2026 Events - </span>THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ARENA</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
            Choose your battleground. Compete with the best.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {EVENTS.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TiltCard
                className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group flex flex-col hover:shadow-[0_0_30px_rgba(255,0,85,0.15)]"
                glowColor="rgba(255, 0, 85, 0.3)"
                tiltIntensity={10}
              >
                <div className="relative h-40 md:h-56 overflow-hidden">
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

                <div className="p-4 md:p-6 flex-1 flex flex-col relative">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 font-mono group-hover:text-primary transition-colors">{event.title}</h3>
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
                    {event.coordinators && event.coordinators.length > 0 && (
                      <div className="flex items-center text-gray-400 text-sm">
                        <Users className="w-4 h-4 mr-3 text-emerald-400" />
                        {event.coordinators.length} Faculty Coordinators
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/register?event=${encodeURIComponent(event.id)}`}
                      state={{ preselectedEventId: event.id }}
                      className="flex-1 text-center bg-white/5 hover:bg-primary hover:text-white text-white font-bold py-3 rounded-xl transition-all border border-white/10 hover:border-primary group-hover:shadow-[0_0_15px_rgba(255,0,85,0.4)] flex items-center justify-center gap-1.5 text-sm md:text-base"
                    >
                      REGISTER
                    </Link>
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="flex-1 bg-white/5 hover:bg-tertiary hover:text-darker text-tertiary font-bold py-3 rounded-xl transition-all border border-tertiary/30 hover:border-tertiary flex items-center justify-center gap-1.5 text-sm md:text-base group-hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]"
                    >
                      DETAILS
                    </button>
                    {event.rulebookUrl && (
                      <a
                        href={event.rulebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 bg-white/5 hover:bg-secondary hover:text-darker text-secondary font-bold rounded-xl transition-all border border-secondary/30 hover:border-secondary flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                        title="Download Rulebook"
                        download
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-dark border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
            <div className="relative h-48 md:h-64 overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent z-10"></div>
              <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-primary border border-white/20 rounded-full text-white transition-all shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 z-20">
                <span className="inline-block px-3 py-1 bg-primary/20 backdrop-blur border border-primary/50 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-2">
                  {selectedEvent.category}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-white font-mono drop-shadow-md">{selectedEvent.title}</h2>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-gray-300 text-base md:text-lg mb-6 leading-relaxed">
                {selectedEvent.description}
              </p>

              <div className="bg-card/40 p-5 rounded-xl border border-white/5 mb-8">
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  General Rules & Regulations
                </h4>
                <ul className="text-gray-400 text-sm space-y-2.5 list-none">
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Team consists of 5 members: 1 for Best Manager, 2 for Marketing, and 2 for Finance.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Entry fee for the Event is ₹10 per team.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Participation in all 3 events is mandatory to qualify for the General Championship.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Participants must bring their college ID for registration.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Participants must be present at the respective venue 15 minutes prior to the scheduled time.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Participants should carry their own stationery, laptops, Wi-Fi dongles, and other required materials.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Accommodation will be provided only for outstation participants upon prior request, and additional charges will be applicable.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    The decision of the judges will be final & binding.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    Any loss or damage to college property shall result in a penalty and loss of points.
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 bg-card/40 p-5 rounded-xl border border-white/5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-secondary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">When</h4>
                    <p className="text-gray-400 text-sm">{selectedEvent.date}</p>
                    <p className="text-gray-500 text-xs">{selectedEvent.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-tertiary">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Format</h4>
                    <p className="text-gray-400 text-sm">{selectedEvent.teamSize}</p>
                    <p className="text-gray-500 text-xs">Eligibility: {selectedEvent.department}</p>
                  </div>
                </div>

                {selectedEvent.coordinators && selectedEvent.coordinators.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-emerald-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Faculty Coordinators</h4>
                      <div className="flex flex-col gap-3">
                        {selectedEvent.coordinators.map((coord, idx) => (
                          <div 
                            key={idx} 
                            className="group/coord p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300"
                          >
                            <div className="flex flex-row items-center gap-3">
                              <p className="text-gray-200 text-sm font-bold group-hover/coord:text-white transition-colors flex-grow whitespace-nowrap overflow-hidden text-ellipsis">
                                {coord.name}
                              </p>
                              {coord.phone && (
                                <a
                                  href={`tel:${coord.phone.replace(/\s+/g, '')}`}
                                  className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/coord:bg-emerald-500 group-hover/coord:text-white transition-all duration-300 text-xs font-bold"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span className="whitespace-nowrap">{coord.phone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Link
                  to={`/register?event=${encodeURIComponent(selectedEvent.id)}`}
                  state={{ preselectedEventId: selectedEvent.id }}
                  className="flex-1 text-center bg-primary hover:bg-white hover:text-primary text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,0,85,0.4)] flex items-center justify-center gap-2 skew-x-[-5deg]"
                >
                  <span className="skew-x-[5deg] flex items-center gap-2">
                    REGISTER NOW <ArrowUpRight className="w-5 h-5" />
                  </span>
                </Link>
                {selectedEvent.rulebookUrl && (
                  <a
                    href={selectedEvent.rulebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 bg-transparent hover:bg-secondary hover:text-darker text-secondary font-bold rounded-xl transition-all border-2 border-secondary flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.2)] skew-x-[-5deg]"
                    title="Download Rulebook"
                    download
                  >
                    <span className="skew-x-[5deg] flex items-center gap-2">
                      <Download className="w-5 h-5" /> PDF
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
