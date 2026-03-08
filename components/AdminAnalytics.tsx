import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { AdminRegistrationRecord } from '../types';
import { EVENTS } from '../constants';
import { Users, TrendingUp, DollarSign, Award, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface AdminAnalyticsProps {
    data: AdminRegistrationRecord[];
}

const COLORS = ['#ff0055', '#00eeff', '#a855f7', '#facc15', '#22c55e', '#ef4444', '#3b82f6'];

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ data }) => {
    // 1. Stats Calculation
    const stats = useMemo(() => {
        const total = data.length;
        const uniqueParticipants = new Set(data.map(r => r.email.toLowerCase())).size;
        const paidRegistrations = data.filter(r => !!r.paymentId).length;
        const totalRevenue = data.reduce((sum, row) => {
            const ev = EVENTS.find(e => e.title === row.eventTitle);
            return row.paymentId && ev?.fee ? sum + ev.fee : sum;
        }, 0);

        return { total, uniqueParticipants, paidRegistrations, totalRevenue };
    }, [data]);

    // 2. Registrations by Event
    const eventDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(r => {
            if (r.eventTitle) counts[r.eventTitle] = (counts[r.eventTitle] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    // 3. College Distribution (Top 5)
    const collegeDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(r => {
            if (r.college) {
                const name = r.college.toUpperCase();
                counts[name] = (counts[name] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [data]);

    // 4. Registration Trend (By Date)
    const trendData = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(r => {
            if (r.timestamp) {
                const date = r.timestamp.split(',')[0].trim(); // Assuming format like "MM/DD/YYYY, HH:MM:SS"
                counts[date] = (counts[date] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-darker/90 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-black text-primary">{payload[0].value} <span className="text-[10px] text-gray-500 font-bold uppercase ml-1">Entries</span></p>
                </div>
            );
        }
        return null;
    };

    const cardVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5 }
        })
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Key Metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Sales', value: stats.total, icon: Users, color: 'text-primary' },
                    { label: 'Active Users', value: stats.uniqueParticipants, icon: Award, color: 'text-secondary' },
                    { label: 'Paid Passes', value: stats.paidRegistrations, icon: CheckCircle2, color: 'text-green-400' },
                    { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: DollarSign, color: 'text-yellow-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <TrendingUp className="w-4 h-4 text-gray-600" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-white font-mono tracking-tighter">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Registration Trend ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" /> REGISTRATION MOMENTUM
                        </h3>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Daily Trend</span>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff0055" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ff0055" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#666"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#666"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#ff0055"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* ── Event Split (Pie) ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col"
                >
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <Award className="w-4 h-4 text-secondary" /> EVENT POPULARITY
                    </h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={eventDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={500}
                                    animationDuration={1500}
                                >
                                    {eventDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-black text-white leading-none">{stats.total}</p>
                            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total</p>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {eventDistribution.slice(0, 4).map((item, i) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] text-gray-400 truncate flex-1">{item.name}</span>
                                <span className="text-[10px] font-bold text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Top Colleges ── */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                >
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400" /> LEADERSHIP BY COLLEGE
                    </h3>
                    <div className="space-y-4">
                        {collegeDistribution.map((college, i) => {
                            const percentage = (college.value / Math.max(...collegeDistribution.map(c => c.value))) * 100;
                            return (
                                <div key={college.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-white truncate max-w-[80%] uppercase tracking-tight">{college.name}</p>
                                        <p className="text-xs font-black text-primary font-mono">{college.value}</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: 0.8 + (i * 0.1), duration: 1 }}
                                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ── Detailed Event Breakdown ── */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                >
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" /> EVENT BREAKDOWN
                    </h3>
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {eventDistribution.map((event) => {
                            const evMatch = EVENTS.find(e => e.title === event.name);
                            const fee = evMatch?.fee || 200; // Package fee or specific fee
                            return (
                                <div key={event.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{evMatch?.category || 'Competition'}</p>
                                        <p className="text-xs font-bold text-white truncate">{event.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-white">{event.value}</p>
                                        <p className="text-[10px] text-green-400 font-bold">₹{event.value * fee}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
