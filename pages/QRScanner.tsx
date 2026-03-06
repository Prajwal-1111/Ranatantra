import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, Camera, CameraOff, Shield, User, Ticket, Calendar, Hash, ArrowLeft, Video, Zap, Activity, History, AlertTriangle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ADMIN_ALLOWED_EMAILS, GOOGLE_CLIENT_ID } from '../constants';
import { getStoredAuthUser, getAuthUserFromToken, persistAuthToken, clearAuthToken } from '../services/authSession';
import { Html5Qrcode } from 'html5-qrcode';

declare const google: any;

interface ScannedData {
    type: string;
    passId: string;
    name: string;
    email: string;
    events: string[];
    registrationIds: string[];
    generatedAt: string;
}

const QRScanner: React.FC = () => {
    const [user, setUser] = useState<{ name: string; email: string; picture: string } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [scanResult, setScanResult] = useState<ScannedData | null>(null);
    const [scanStatus, setScanStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [scanHistory, setScanHistory] = useState<Array<{ data: ScannedData; time: string; status: string }>>([]);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = 'qr-reader';

    useEffect(() => {
        const storedUser = getStoredAuthUser();
        if (storedUser) {
            setUser(storedUser);
            const normalized = ADMIN_ALLOWED_EMAILS.map(e => e.trim().toLowerCase());
            setIsAdmin(normalized.includes(storedUser.email.trim().toLowerCase()));
        }
    }, []);

    useEffect(() => {
        if (!user) {
            const renderGoogleButton = () => {
                const container = document.getElementById('googleSignInDivScanner');
                if (typeof google !== 'undefined' && container) {
                    try {
                        container.innerHTML = '';
                        google.accounts.id.initialize({
                            client_id: GOOGLE_CLIENT_ID,
                            callback: (response: any) => {
                                const authUser = getAuthUserFromToken(response.credential);
                                if (authUser) {
                                    persistAuthToken(response.credential);
                                    setUser(authUser);
                                    const normalized = ADMIN_ALLOWED_EMAILS.map(e => e.trim().toLowerCase());
                                    setIsAdmin(normalized.includes(authUser.email.trim().toLowerCase()));
                                }
                            }
                        });
                        google.accounts.id.renderButton(container, {
                            theme: 'filled_black',
                            size: 'large',
                            width: 250,
                            text: 'continue_with'
                        });
                    } catch (e) {
                        console.error('Google Sign In Error:', e);
                    }
                }
            };

            if (typeof google !== 'undefined') {
                renderGoogleButton();
            } else {
                const interval = setInterval(() => {
                    if (typeof google !== 'undefined') {
                        renderGoogleButton();
                        clearInterval(interval);
                    }
                }, 500);
                return () => clearInterval(interval);
            }
        }
    }, [user]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        setCameraError('');
        try {
            const container = document.getElementById(scannerContainerId);
            if (!container) {
                setCameraError('Scanner container not found. Please refresh the page.');
                return;
            }

            if (html5QrCodeRef.current) {
                try {
                    const state = html5QrCodeRef.current.getState();
                    if (state === 2) await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current.clear();
                } catch { }
                html5QrCodeRef.current = null;
            }

            const html5QrCode = new Html5Qrcode(scannerContainerId);
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: 20, // Faster scanning
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.7);
                        return { width: qrboxSize, height: qrboxSize };
                    },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    processQRData(decodedText);
                    try {
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const oscillator = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        oscillator.connect(gain);
                        gain.connect(audioCtx.destination);
                        oscillator.frequency.value = 1000;
                        gain.gain.value = 0.1;
                        oscillator.start();
                        oscillator.stop(audioCtx.currentTime + 0.1);
                    } catch { }
                },
                () => { }
            );

            setCameraActive(true);
        } catch (err: any) {
            console.error('Camera error:', err);
            if (err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
                setCameraError('Camera access denied. Please allow camera access in browser settings.');
            } else {
                setCameraError(`Camera error: ${err?.message || 'Unable to access camera.'}`);
            }
            setCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                const state = html5QrCodeRef.current.getState();
                if (state === 2) await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch { }
            html5QrCodeRef.current = null;
        }
        setCameraActive(false);
    };

    const processQRData = (rawData: string) => {
        try {
            const data: ScannedData = JSON.parse(rawData);

            if (data.type !== 'RANATANTRA_PASS') {
                setScanStatus('invalid');
                setErrorMessage('Invalid QR code format detected.');
                setScanResult(null);
                return;
            }

            const isDuplicate = scanHistory.some(entry => entry.data.passId === data.passId);

            setScanResult(data);
            setScanStatus('valid');
            setErrorMessage('');
            stopCamera();

            setScanHistory(prev => [{
                data,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                status: isDuplicate ? 'duplicate' : 'valid'
            }, ...prev.slice(0, 49)]);
        } catch {
            setScanStatus('invalid');
            setErrorMessage('Could not parse data. Ensure it\'s a Ranatantra pass.');
            setScanResult(null);
        }
    };

    const handleReset = () => {
        setScanResult(null);
        setScanStatus('idle');
        setErrorMessage('');
    };

    const handleScanNext = () => {
        handleReset();
        setTimeout(() => startCamera(), 400);
    };

    if (!user) {
        return (
            <div className="pt-24 min-h-screen bg-darker flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,#ff005510_0%,transparent_50%)]"></div>
                <div className="bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-12 text-center max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12 shadow-[0_10px_30px_rgba(255,0,85,0.4)]">
                        <Shield className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Access Secure</h2>
                    <p className="text-gray-400 mb-8 font-medium">Please sign in as authorized personnel to continue to the scanning terminal.</p>
                    <div id="googleSignInDivScanner" className="flex justify-center transition-transform hover:scale-105 active:scale-95"></div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="pt-24 min-h-screen bg-darker flex flex-col items-center justify-center p-4">
                <div className="bg-card/40 backdrop-blur-2xl border border-red-500/10 rounded-[2.5rem] p-12 text-center max-w-md w-full animate-shake">
                    <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_10px_30px_rgba(239,68,68,0.3)]">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Restricted Area</h2>
                    <p className="text-gray-400 mb-8 font-medium">Your credentials do not grant access to this terminal. Contact base command if this is an error.</p>
                    <button
                        onClick={() => { clearAuthToken(); setUser(null); setIsAdmin(false); }}
                        className="w-full py-4 bg-white text-darker font-black rounded-2xl hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                        Switch Command Profile
                    </button>
                </div>
            </div>
        );
    }

    const uniqueScansCount = new Set(scanHistory.map(e => e.data.passId)).size;
    const totalScansCount = scanHistory.length;

    return (
        <div className="pt-24 min-h-screen bg-[#05000a] text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden font-outfit">
            {/* HUD Atmosphere */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[160px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto z-10 relative">
                {/* HUD Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 group">
                    <div className="space-y-4">
                        <NavLink to="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-all font-bold tracking-widest text-[10px] uppercase bg-white/5 py-1.5 px-4 rounded-full border border-white/5 hover:border-primary/30">
                            <ArrowLeft className="w-3 h-3" /> Return to HQ
                        </NavLink>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,85,0.2)]">
                                <QrCode className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">Scanner <span className="text-primary">Terminal</span></h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Online // Unit 01</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pro Dashboard Mini */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Verified', val: uniqueScansCount, color: 'text-green-400', icon: CheckCircle },
                            { label: 'Total', val: totalScansCount, color: 'text-primary', icon: Activity },
                            { label: 'Uptime', val: '99%', color: 'text-secondary', icon: Zap }
                        ].map((stat, i) => (
                            <div key={i} className="bg-card/30 backdrop-blur-md border border-white/5 p-4 py-3 rounded-2xl min-w-[100px] transition-transform hover:-translate-y-1">
                                <div className="flex items-center justify-between mb-1">
                                    <stat.icon className={`w-3 h-3 ${stat.color} opacity-50`} />
                                    <span className={`text-xl font-black tracking-tighter ${stat.color}`}>{stat.val}</span>
                                </div>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Viewfinder Column */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                        <div className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-2 sm:p-3 overflow-hidden shadow-2xl relative">
                            {/* Scanning UI Layer */}
                            <div className="relative rounded-[1.8rem] overflow-hidden bg-black/40 border border-white/5 aspect-square sm:aspect-video lg:aspect-square flex items-center justify-center group">
                                <div id={scannerContainerId} className="w-full h-full object-cover"></div>

                                {/* HUD Viewfinder Elements */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-4 border-transparent">
                                    {/* Scan Area Frame */}
                                    <div className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] border-2 border-white/10 rounded-3xl relative">
                                        {/* HUD Corner Accents */}
                                        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[3px] border-l-[3px] border-primary rounded-tl-xl shadow-[-5px_-5px_15px_rgba(255,0,85,0.4)]"></div>
                                        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[3px] border-r-[3px] border-primary rounded-tr-xl shadow-[5px_-5px_15px_rgba(255,0,85,0.4)]"></div>
                                        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[3px] border-l-[3px] border-primary rounded-bl-xl shadow-[-5px_5px_15px_rgba(255,0,85,0.4)]"></div>
                                        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[3px] border-r-[3px] border-primary rounded-br-xl shadow-[5px_5px_15px_rgba(255,0,85,0.4)]"></div>

                                        {/* Animated Scan Line */}
                                        {cameraActive && (
                                            <div className="absolute left-4 right-4 h-[2px] bg-primary/80 shadow-[0_0_15px_#ff0055] z-10 animate-scan pointer-events-none"></div>
                                        )}
                                    </div>

                                    {/* HUD Readout text */}
                                    <div className="absolute top-8 left-8 text-[10px] font-mono text-primary animate-pulse tracking-widest">DETECTION_ENGINE_ACTIVE</div>
                                    <div className="absolute bottom-8 right-8 text-[10px] font-mono text-secondary animate-pulse tracking-widest">SYSTEM_VERSION_1.2</div>
                                </div>

                                {/* Placeholder View */}
                                {!cameraActive && scanStatus === 'idle' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 transition-opacity duration-500">
                                        <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative group/btn cursor-pointer overflow-hidden p-6" onClick={startCamera}>
                                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/btn:opacity-100 transition-opacity blur-xl"></div>
                                            <Camera className="w-16 h-16 text-primary transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-12" />
                                        </div>
                                        <h3 className="text-xl font-bold tracking-tight">System Ready</h3>
                                        <p className="text-gray-500 text-sm mt-1 max-w-[240px] text-center px-4">Initialize imaging sensor to begin verification sequences.</p>
                                    </div>
                                )}
                            </div>

                            {/* Control Strip */}
                            <div className="mt-6 flex gap-4 p-4 items-center">
                                {!cameraActive ? (
                                    <button
                                        onClick={startCamera}
                                        className="flex-1 flex items-center justify-center gap-3 py-5 bg-primary text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,0,85,0.4)] text-[11px] uppercase tracking-widest"
                                    >
                                        <Zap className="w-5 h-5" /> Initialize Sensor
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopCamera}
                                        className="flex-1 flex items-center justify-center gap-3 py-5 bg-red-600/20 border border-red-600/30 text-red-500 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all text-[11px] uppercase tracking-widest"
                                    >
                                        <CameraOff className="w-5 h-5" /> Terminate Signal
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Result & History Column */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                        {/* Result Panel */}
                        <div className={`relative bg-card/40 backdrop-blur-2xl border ${scanStatus === 'valid' ? 'border-green-500/20' : scanStatus === 'invalid' ? 'border-red-500/20' : 'border-white/5'} rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 min-h-[460px] flex flex-col`}>
                            {scanStatus === 'idle' ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 border border-secondary/20 rounded-full animate-ping-slow"></div>
                                        <Activity className="w-12 h-12 text-secondary opacity-30" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter opacity-30 italic">Idle <span className="text-secondary">Mode</span></h3>
                                    <p className="text-gray-500 text-xs mt-3 uppercase tracking-widest font-bold">Awaiting digital fingerprint...</p>
                                </div>
                            ) : scanStatus === 'valid' && scanResult ? (
                                <div className="animate-fade-in space-y-6 flex-1">
                                    {/* Success Badge */}
                                    <div className={`flex items-center gap-4 p-5 rounded-3xl ${scanHistory[0]?.status === 'duplicate' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${scanHistory[0]?.status === 'duplicate' ? 'bg-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}>
                                            {scanHistory[0]?.status === 'duplicate' ? <AlertTriangle className="w-10 h-10 text-yellow-500" /> : <CheckCircle className="w-10 h-10 text-green-500" />}
                                        </div>
                                        <div>
                                            <p className={`text-xl font-black uppercase tracking-tighter ${scanHistory[0]?.status === 'duplicate' ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {scanHistory[0]?.status === 'duplicate' ? 'RE-ENTRY DETECTED' : 'CLEARANCE GRANTED'}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Scan Sequence Verified // OK</p>
                                        </div>
                                    </div>

                                    {/* Data Fields */}
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { label: 'Identified Participant', val: scanResult.name, icon: User, color: 'text-secondary' },
                                            { label: 'Digital Handle', val: scanResult.email, icon: Hash, color: 'text-primary' },
                                            { label: 'Terminal Pass ID', val: scanResult.passId, icon: Shield, color: 'text-secondary' }
                                        ].map((f, i) => (
                                            <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl group/field flex items-center gap-4 transition-all hover:bg-white/10 hover:border-white/10">
                                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${f.color} group-hover/field:scale-110 transition-transform`}>
                                                    <f.icon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-0.5">{f.label}</p>
                                                    <p className="font-bold text-sm truncate">{f.val}</p>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl group/field">
                                            <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-3">Enrolled Protocols ({scanResult.events.length})</p>
                                            <div className="flex flex-wrap gap-2">
                                                {scanResult.events.map((e, idx) => (
                                                    <span key={idx} className="text-[9px] font-black bg-primary/20 text-primary px-4 py-1.5 rounded-full border border-primary/30 uppercase tracking-tighter">
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleScanNext}
                                        className="w-full py-5 bg-white text-darker font-black rounded-[1.5rem] hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0 text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 group"
                                    >
                                        <Video className="w-5 h-5 group-hover:animate-pulse" /> Re-engage Scanner
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in flex-1 flex flex-col py-12">
                                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-center">
                                        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                            <XCircle className="w-10 h-10 text-red-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-red-500 uppercase tracking-tighter">PROTOCOL_ERROR</h3>
                                        <p className="text-red-400/80 text-sm font-medium mt-3 italic">"{errorMessage}"</p>
                                    </div>
                                    <button
                                        onClick={handleScanNext}
                                        className="mt-auto py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white hover:text-darker transition-all uppercase text-[10px] tracking-widest"
                                    >
                                        Retry Scan Protocol
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* History Overlay (Mobile Bottom / Desktop Right) */}
                        {scanHistory.length > 0 && (
                            <div className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                                        <History className="w-3 h-3" /> Recent Activity Log
                                    </h4>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">LOGS_ENABLED</span>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {scanHistory.map((entry, idx) => (
                                        <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:bg-white/5 ${entry.status === 'duplicate' ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-black/20 border-white/5'}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${entry.status === 'duplicate' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                                                    <CheckCircle className={`w-4 h-4 ${entry.status === 'duplicate' ? 'opacity-50' : 'opacity-100'}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-white truncate uppercase tracking-tight">{entry.data.name}</p>
                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter opacity-50">{entry.time} // {entry.data.passId}</p>
                                                </div>
                                            </div>
                                            <div className={`text-[9px] font-black uppercase py-1 px-3 rounded-full border ${entry.status === 'duplicate' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' : 'border-green-500/30 text-green-500 bg-green-500/10'}`}>
                                                {entry.status === 'duplicate' ? 'RESCAN' : 'VALID'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Injected Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0% { top: 16px; opacity: 0; }
                    5% { opacity: 1; }
                    50% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: calc(100% - 18px); opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
                @keyframes ping-slow {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .animate-ping-slow {
                    animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
};

export default QRScanner;
