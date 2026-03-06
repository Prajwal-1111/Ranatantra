import React, { useEffect, useMemo, useState } from 'react';
import { GOOGLE_CLIENT_ID, ADMIN_ALLOWED_EMAILS, EVENTS } from '../constants';
import { getAllRegistrationsForAdmin } from '../services/googleSheets';
import { clearAuthToken, getAuthUserFromToken, getStoredAuthUser, persistAuthToken, type AuthUser } from '../services/authSession';
import { AlertCircle, Loader2, LogOut, Shield, Users, RefreshCcw, Download, DollarSign, TrendingUp, UserCheck, CreditCard, Filter, Search, ChevronDown } from 'lucide-react';
import type { AdminRegistrationRecord } from '../types';
import { AdminSkeleton } from '../components/Skeleton';
import AdminAnalytics from '../components/AdminAnalytics';

declare const google: any;

const normalizedAllowedEmails = ADMIN_ALLOWED_EMAILS.map((email) => email.trim().toLowerCase());

const Admin: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<AdminRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [activeView, setActiveView] = useState<'table' | 'analytics'>('analytics');

  const isAuthorized = !!user && normalizedAllowedEmails.includes((user.email || '').toLowerCase());

  const handleCredentialResponse = (response: any) => {
    const authUser = getAuthUserFromToken(response.credential);
    if (!authUser) return;
    persistAuthToken(response.credential);
    setUser(authUser);
    setMessage('');
  };

  const handleSignOut = () => {
    clearAuthToken();
    setUser(null);
    setRows([]);
    setMessage('');
  };

  const fetchAllRegistrations = async (adminEmail: string, forceRefresh = false) => {
    setLoading(true);
    setMessage('');
    const response = await getAllRegistrationsForAdmin(adminEmail, forceRefresh);
    setLoading(false);
    if (response.status === 'success') {
      setRows(response.data || []);
      if (!response.data || response.data.length === 0) setMessage('No registrations found.');
      return;
    }
    setRows([]);
    setMessage(response.message || 'Failed to load registrations.');
  };

  const handleRefresh = () => {
    if (user && isAuthorized) fetchAllRegistrations(user.email, true);
  };

  useEffect(() => {
    const storedUser = getStoredAuthUser();
    if (storedUser) setUser(storedUser);
  }, []);

  useEffect(() => {
    const renderGoogleButton = () => {
      const buttonContainer = document.getElementById('googleSignInDivAdmin');
      if (typeof google === 'undefined' || !buttonContainer) return;
      try {
        const buttonWidth = Math.min(Math.max(buttonContainer.clientWidth || 260, 220), 420);
        buttonContainer.innerHTML = '';
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
        google.accounts.id.renderButton(buttonContainer, { theme: 'filled_black', size: 'large', width: buttonWidth, text: 'continue_with' });
      } catch (error) {
        console.error('Google Sign In Error:', error);
      }
    };
    if (user) return;
    if (typeof google !== 'undefined') { renderGoogleButton(); return; }
    const interval = setInterval(() => {
      if (typeof google !== 'undefined') { renderGoogleButton(); clearInterval(interval); }
    }, 500);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user || !isAuthorized) return;
    fetchAllRegistrations(user.email);
  }, [user, isAuthorized]);

  // ── Unique events for filter ──
  const uniqueEvents = useMemo(() => {
    return [...new Set(rows.map((r) => r.eventTitle).filter(Boolean))].sort();
  }, [rows]);

  // ── Filtered rows ──
  const filteredRows = useMemo(() => {
    let result = rows;
    if (eventFilter !== 'all') result = result.filter((row) => row.eventTitle === eventFilter);
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((row) =>
        [row.fullName, row.email, row.eventTitle, row.college, row.department, row.registrationId, row.razorpayPaymentId]
          .join(' ').toLowerCase().includes(query)
      );
    }
    return result;
  }, [rows, search, eventFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = filteredRows.length;
    const unique = new Set(filteredRows.map((r) => (r.email || '').toLowerCase())).size;
    const paid = filteredRows.filter((r) => !!r.razorpayPaymentId).length;
    const revenue = filteredRows.reduce((sum, row) => {
      const ev = EVENTS.find((e) => e.title === row.eventTitle);
      return row.razorpayPaymentId && ev?.fee ? sum + ev.fee : sum;
    }, 0);
    const eventCounts: Record<string, number> = {};
    filteredRows.forEach((r) => { if (r.eventTitle) eventCounts[r.eventTitle] = (eventCounts[r.eventTitle] || 0) + 1; });
    const top = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0];
    return { total, unique, paid, revenue, topEvent: top?.[0] || '-', topCount: top?.[1] || 0 };
  }, [filteredRows]);

  // ── CSV Export ──
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Event', 'Event Date', 'Reg ID', 'Payment ID', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredRows.map((row) => [
        `"${(row.timestamp || '').replace(/"/g, '""')}"`,
        `"${(row.fullName || '').replace(/"/g, '""')}"`,
        `"${(row.email || '').replace(/"/g, '""')}"`,
        `"${(row.phone || '').replace(/"/g, '""')}"`,
        `"${(row.college || '').replace(/"/g, '""')}"`,
        `"${(row.department || '').replace(/"/g, '""')}"`,
        `"${(row.year || '').replace(/"/g, '""')}"`,
        `"${(row.eventTitle || '').replace(/"/g, '""')}"`,
        `"${(row.eventDate || '').replace(/"/g, '""')}"`,
        `"${(row.registrationId || '').replace(/"/g, '""')}"`,
        `"${(row.razorpayPaymentId || '').replace(/"/g, '""')}"`,
        row.razorpayPaymentId ? 'PAID' : 'FREE',
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranatantra_registrations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-24 min-h-screen bg-darker relative overflow-hidden">
      {/* ── Background Decorations ── */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/5 rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12">

        {/* ── Header ── */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="animate-fade-in-up flex flex-col items-start">
            <img src="/logo.png" alt="Ranatantra Logo" className="h-14 md:h-18 w-auto mb-4 object-contain" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(255,0,85,0.2)]">
              <Shield className="w-3.5 h-3.5" /> COMMAND CENTER
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter uppercase leading-none">
              Command <span className="text-primary text-glow">Center</span>
            </h1>
            <p className="text-gray-400 mt-3 text-sm md:text-base">Real-time overview of all registrations and revenue.</p>
            <a href="#/scanner" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-secondary/10 border border-secondary/40 text-secondary text-sm font-bold rounded-xl hover:bg-secondary/20 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>
              QR Scanner
            </a>
          </div>

          {user && (
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 p-2 pr-4 rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {user.picture ? (
                <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-secondary truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Login Required ── */}
        {!user && (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-10 animate-fade-in-up shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,0,85,0.3)]">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin Authentication</h2>
            <p className="text-gray-400 mb-6 text-sm">Sign in with an authorized admin account to continue.</p>
            <div id="googleSignInDivAdmin" className="h-[44px] w-full max-w-[280px]" />
          </div>
        )}

        {/* ── Access Denied ── */}
        {user && !isAuthorized && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 animate-fade-in-up shadow-[0_0_30px_rgba(255,0,0,0.1)]">
            <div className="flex items-center gap-3 text-red-300">
              <AlertCircle className="w-6 h-6" />
              <p className="font-bold text-lg">Access Denied</p>
            </div>
            <p className="text-red-200/70 mt-3 text-sm">
              The account <span className="font-mono text-red-300">{user.email}</span> is not authorized. Contact the administrator.
            </p>
          </div>
        )}

        {/* ── Main Dashboard ── */}
        {user && isAuthorized && (
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>

            {/* ── Stats Cards ── */}
            {!loading && rows.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Registrations */}
                <div className="group relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-primary/40 transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 transition-colors duration-500" />
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(255,0,85,0.2)] group-hover:shadow-[0_0_25px_rgba(255,0,85,0.4)] transition-shadow duration-500">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Registrations</p>
                    <p className="text-3xl font-black text-white font-mono leading-none">{stats.total}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-bold">{stats.paid} paid</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/15 text-gray-400 font-bold">{stats.total - stats.paid} free</span>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="group relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-secondary/40 transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-[40px] group-hover:bg-secondary/20 transition-colors duration-500" />
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,255,255,0.2)] group-hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] transition-shadow duration-500">
                      <UserCheck className="w-5 h-5 text-secondary" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Participants</p>
                    <p className="text-3xl font-black text-white font-mono leading-none">{stats.unique}</p>
                    <p className="text-[10px] text-gray-500 mt-2">unique emails</p>
                  </div>
                </div>

                {/* Revenue */}
                <div className="group relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-green-500/40 transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-[40px] group-hover:bg-green-500/20 transition-colors duration-500" />
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(34,197,94,0.2)] group-hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-shadow duration-500">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Revenue</p>
                    <p className="text-3xl font-black text-white font-mono leading-none">₹{stats.revenue}</p>
                    <p className="text-[10px] text-gray-500 mt-2">from paid entries</p>
                  </div>
                </div>

                {/* Top Event */}
                <div className="group relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/20 transition-colors duration-500" />
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-500/30 to-purple-500/10 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-shadow duration-500">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Top Event</p>
                    <p className="text-base font-bold text-white leading-tight truncate" title={stats.topEvent}>{stats.topEvent}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{stats.topCount} registrations</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── View Toggle ── */}
            <div className="flex p-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl w-fit">
              <button
                onClick={() => setActiveView('analytics')}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeView === 'analytics' ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,0,85,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ANALYTICS
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeView === 'table' ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,0,85,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                DETAILED TABLE
              </button>
            </div>

            {activeView === 'analytics' ? (
              <AdminAnalytics data={filteredRows} />
            ) : (
              <>
                {/* ── Toolbar ── */}
                <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: counts + actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-2 rounded-xl">
                        <Users className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-bold text-white font-mono">{filteredRows.length}</span>
                        {eventFilter !== 'all' && <span className="text-[10px] text-gray-500 font-semibold">/ {rows.length}</span>}
                      </div>

                      <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-secondary/40 hover:bg-secondary/5 transition-all duration-300 disabled:opacity-50 group"
                        title="Refresh"
                      >
                        <RefreshCcw className={`w-4 h-4 group-hover:text-secondary transition-colors ${loading ? 'animate-spin' : ''}`} />
                      </button>

                      <button
                        onClick={handleExportCSV}
                        disabled={loading || filteredRows.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 hover:bg-green-500/20 hover:border-green-400/40 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all duration-300 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                        title="Export CSV"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                    </div>

                    {/* Right: filters */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                        <select
                          value={eventFilter}
                          onChange={(e) => setEventFilter(e.target.value)}
                          className="w-full sm:w-56 bg-black/40 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 focus:shadow-[0_0_10px_rgba(255,0,85,0.1)] appearance-none transition-all duration-300"
                        >
                          <option value="all" className="bg-darker">All Events</option>
                          {uniqueEvents.map((title) => (
                            <option key={title} value={title} className="bg-darker">{title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search name, email, event..."
                          className="w-full sm:w-72 bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-primary/50 focus:shadow-[0_0_10px_rgba(255,0,85,0.1)] transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Data ── */}
                <div className="bg-card/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.4)]">
                  {loading ? (
                    <AdminSkeleton />
                  ) : filteredRows.length === 0 && !message ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 text-sm">No records match your filters.</p>
                      <button onClick={() => { setSearch(''); setEventFilter('all'); }} className="mt-3 text-xs text-primary hover:text-white transition-colors font-bold">
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards */}
                      <div className="space-y-3 p-4 md:hidden custom-scrollbar max-h-[70vh] overflow-y-auto">
                        {filteredRows.map((row, index) => {
                          const details = [
                            { label: 'Phone', value: row.phone },
                            { label: 'College', value: row.college },
                            { label: 'Branch', value: row.department },
                            { label: 'Year', value: row.year },
                            { label: 'Event Date', value: row.eventDate },
                            { label: 'Reg ID', value: row.registrationId },
                            { label: 'Payment ID', value: row.razorpayPaymentId },
                            { label: 'Timestamp', value: row.timestamp },
                          ];

                          return (
                            <article
                              key={`${row.email}-${row.eventId}-${index}`}
                              className="rounded-xl border border-white/5 bg-black/30 p-4 hover:border-primary/30 transition-all duration-300"
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-white">{row.fullName || '-'}</p>
                                  <p className="text-xs text-secondary/80 break-all font-mono">{row.email || '-'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                                    {row.eventTitle || '-'}
                                  </span>
                                  {row.razorpayPaymentId ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-lg shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                                      <CreditCard className="w-3 h-3" /> PAID
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-lg">FREE</span>
                                  )}
                                </div>
                              </div>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-white/5 pt-3">
                                {details.map((d) => (
                                  <div key={d.label} className="min-w-0">
                                    <dt className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{d.label}</dt>
                                    <dd className="text-gray-300 break-words mt-0.5">{d.value || '-'}</dd>
                                  </div>
                                ))}
                              </dl>
                            </article>
                          );
                        })}
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto custom-scrollbar">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-black/60 border-b border-white/10">
                              {['Timestamp', 'Name', 'Email', 'Phone', 'College', 'Dept', 'Year', 'Event', 'Date', 'Reg ID', 'Payment', 'Status'].map((header) => (
                                <th key={header} className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRows.map((row, index) => (
                              <tr
                                key={`${row.email}-${row.eventId}-${index}`}
                                className="border-t border-white/[0.03] text-gray-300 hover:bg-white/[0.03] transition-colors duration-200"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{row.timestamp || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">{row.fullName || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-secondary/70">{row.email || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{row.phone || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap max-w-[140px] truncate" title={row.college}>{row.college || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{row.department || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">{row.year || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                                    {row.eventTitle || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-xs">{row.eventDate || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="font-mono text-xs text-primary/80">{row.registrationId || '-'}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {row.razorpayPaymentId ? (
                                    <a href={`https://dashboard.razorpay.com/app/payments/${row.razorpayPaymentId}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-secondary/70 hover:text-secondary transition-colors" title="View on Razorpay">
                                      {row.razorpayPaymentId} 🔗
                                    </a>
                                  ) : <span className="text-gray-600">-</span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {row.razorpayPaymentId ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-lg shadow-[0_0_6px_rgba(34,197,94,0.1)]">
                                      <CreditCard className="w-3 h-3" /> PAID
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-lg">FREE</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  {message && (
                    <div className="m-4 flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="text-sm">{message}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
