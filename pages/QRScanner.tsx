import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, Camera, CameraOff, Shield, User, Ticket, Calendar, Hash, ArrowLeft, Video, VideoOff, SwitchCamera } from 'lucide-react';
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

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        setCameraError('');
        try {
            // Ensure container exists
            const container = document.getElementById(scannerContainerId);
            if (!container) {
                setCameraError('Scanner container not found. Please refresh the page.');
                return;
            }

            // Stop any existing instance
            if (html5QrCodeRef.current) {
                try {
                    const state = html5QrCodeRef.current.getState();
                    if (state === 2) { // SCANNING
                        await html5QrCodeRef.current.stop();
                    }
                    html5QrCodeRef.current.clear();
                } catch {
                    // ignore cleanup errors
                }
                html5QrCodeRef.current = null;
            }

            const html5QrCode = new Html5Qrcode(scannerContainerId);
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    // Successfully scanned
                    processQRData(decodedText);
                    // Play a success sound
                    try {
                        const audioCtx = new AudioContext();
                        const oscillator = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        oscillator.connect(gain);
                        gain.connect(audioCtx.destination);
                        oscillator.frequency.value = 800;
                        gain.gain.value = 0.3;
                        oscillator.start();
                        oscillator.stop(audioCtx.currentTime + 0.15);
                    } catch { /* ignore audio errors */ }
                },
                () => {
                    // QR code not found in frame - this is normal, just keep scanning
                }
            );

            setCameraActive(true);
        } catch (err: any) {
            console.error('Camera error:', err);
            if (err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
                setCameraError('Camera access denied. Please allow camera access in your browser settings and try again.');
            } else if (err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError') {
                setCameraError('No camera found on this device. Please use the manual input method.');
            } else {
                setCameraError(`Camera error: ${err?.message || 'Unable to access camera. Try the manual input method.'}`);
            }
            setCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                const state = html5QrCodeRef.current.getState();
                if (state === 2) { // SCANNING
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch {
                // ignore cleanup errors
            }
            html5QrCodeRef.current = null;
        }
        setCameraActive(false);
    };

    const processQRData = (rawData: string) => {
        try {
            const data: ScannedData = JSON.parse(rawData);

            if (data.type !== 'RANATANTRA_PASS') {
                setScanStatus('invalid');
                setErrorMessage('Invalid QR code. This is not a Ranatantra pass.');
                setScanResult(null);
                return;
            }

            // Check for duplicate scan
            const isDuplicate = scanHistory.some(entry => entry.data.passId === data.passId);

            setScanResult(data);
            setScanStatus('valid');
            setErrorMessage('');

            // Pause camera after successful scan
            stopCamera();

            // Add to scan history
            setScanHistory(prev => [{
                data,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                status: isDuplicate ? 'duplicate' : 'valid'
            }, ...prev.slice(0, 99)]);
        } catch {
            setScanStatus('invalid');
            setErrorMessage('Unable to read QR code data. The format appears to be invalid.');
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
        // Small delay to let DOM update
        setTimeout(() => startCamera(), 300);
    };

    if (!user) {
        return (
            <div className="pt-24 min-h-screen bg-darker flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,0,85,0.3)]">
                        <Shield className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Admin Sign In Required</h2>
                    <p className="text-gray-400 mb-6 text-sm">Only authorized admins can access the QR Scanner.</p>
                    <div id="googleSignInDivScanner" className="flex justify-center"></div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="pt-24 min-h-screen bg-darker flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center max-w-md w-full">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400 mb-6 text-sm">Your account ({user.email}) is not authorized for this page.</p>
                    <button
                        onClick={() => { clearAuthToken(); setUser(null); setIsAdmin(false); }}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-white hover:text-primary transition-all"
                    >
                        Sign in with another account
                    </button>
                </div>
            </div>
        );
    }

    const uniqueScans = new Set(scanHistory.map(e => e.data.passId)).size;
    const duplicateScans = scanHistory.filter(e => e.status === 'duplicate').length;

    return (
        <div className="pt-24 min-h-screen bg-darker p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"></div>

            <div className="max-w-5xl mx-auto z-10 relative">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col items-start">
                        <NavLink to="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-3 text-sm transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Admin Panel
                        </NavLink>
                        <h1 className="text-3xl md:text-4xl font-black text-white font-mono tracking-tighter uppercase flex items-center gap-3">
                            <QrCode className="w-9 h-9 text-primary" /> QR Scanner
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">Scan participant QR codes for event entry verification.</p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center min-w-[70px]">
                            <p className="text-2xl font-black text-green-400">{uniqueScans}</p>
                            <p className="text-[10px] font-bold text-green-500/70 uppercase tracking-wider">Verified</p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-center min-w-[70px]">
                            <p className="text-2xl font-black text-yellow-400">{duplicateScans}</p>
                            <p className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-wider">Duplicate</p>
                        </div>
                        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-center min-w-[70px]">
                            <p className="text-2xl font-black text-primary">{scanHistory.length}</p>
                            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">Total</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Scanner Section */}
                    <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Video className="w-5 h-5 text-secondary" /> Camera Scanner
                        </h2>

                        {/* Camera viewfinder */}
                        <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/5 mb-4">
                            <div
                                id={scannerContainerId}
                                className="w-full min-h-[300px] md:min-h-[350px]"
                                style={{ position: 'relative' }}
                            ></div>

                            {/* Viewfinder overlay when camera is not active */}
                            {!cameraActive && scanStatus === 'idle' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                                    <div className="w-48 h-48 border-2 border-dashed border-primary/40 rounded-2xl flex items-center justify-center mb-4 relative">
                                        {/* Corner markers */}
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-md"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-md"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-md"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-md"></div>
                                        <Camera className="w-12 h-12 text-primary/50" />
                                    </div>
                                    <p className="text-gray-500 text-sm">Tap below to start scanning</p>
                                </div>
                            )}
                        </div>

                        {/* Camera controls */}
                        <div className="flex gap-3">
                            {!cameraActive ? (
                                <button
                                    onClick={startCamera}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-white hover:text-primary transition-all shadow-[0_0_15px_rgba(255,0,85,0.3)]"
                                >
                                    <Camera className="w-5 h-5" /> Start Camera
                                </button>
                            ) : (
                                <button
                                    onClick={stopCamera}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 border border-red-500/40 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition-all"
                                >
                                    <CameraOff className="w-5 h-5" /> Stop Camera
                                </button>
                            )}
                        </div>

                        {/* Camera scanning indicator */}
                        {cameraActive && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-secondary animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                Scanning... Point camera at QR code
                            </div>
                        )}

                        {/* Camera error */}
                        {cameraError && (
                            <div className="mt-4 flex items-start gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-500/20 text-sm">
                                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>{cameraError}</p>
                            </div>
                        )}
                    </div>

                    {/* Result Section */}
                    <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Verification Result</h2>

                        {scanStatus === 'idle' && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center mb-4 relative">
                                    <QrCode className="w-12 h-12 text-gray-600" />
                                    {/* Animated scan line */}
                                    <div className="absolute top-3 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
                                </div>
                                <p className="text-gray-500 text-sm font-semibold">Waiting for QR code...</p>
                                <p className="text-gray-600 text-xs mt-1">Point your camera at a QR pass</p>
                            </div>
                        )}

                        {scanStatus === 'valid' && scanResult && (
                            <div className="animate-fade-in-up">
                                {/* Check if duplicate */}
                                {scanHistory[0]?.status === 'duplicate' ? (
                                    <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 mb-5 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-6 h-6 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-yellow-400 font-bold">Pass Already Scanned ⚠️</p>
                                            <p className="text-yellow-500/70 text-xs">This pass was verified earlier. Could be a re-entry.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-4 mb-5 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-green-400 font-bold">Pass Verified ✓</p>
                                            <p className="text-green-500/70 text-xs">This is a valid Ranatantra entry pass.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Participant Details */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                        <User className="w-5 h-5 text-secondary shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Name</p>
                                            <p className="text-white font-bold truncate text-lg">{scanResult.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                        <Hash className="w-5 h-5 text-secondary shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Email</p>
                                            <p className="text-white font-mono text-sm truncate">{scanResult.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                        <Ticket className="w-5 h-5 text-secondary shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Events ({scanResult.events.length})</p>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {scanResult.events.map((event, i) => (
                                                    <span key={i} className="text-[11px] font-bold bg-primary/15 text-primary px-2.5 py-1 rounded-full border border-primary/30">
                                                        {event}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                        <Calendar className="w-5 h-5 text-secondary shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Pass ID</p>
                                            <p className="text-white text-sm font-mono">{scanResult.passId}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleScanNext}
                                    className="w-full mt-5 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-white hover:text-primary transition-all shadow-[0_0_15px_rgba(255,0,85,0.3)] flex items-center justify-center gap-2"
                                >
                                    <Camera className="w-5 h-5" /> Scan Next Pass
                                </button>
                            </div>
                        )}

                        {scanStatus === 'invalid' && (
                            <div className="animate-fade-in-up">
                                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-5 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                                        <XCircle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-red-400 font-bold">Invalid Pass ✗</p>
                                        <p className="text-red-500/70 text-xs">{errorMessage}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleScanNext}
                                    className="w-full py-3.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Camera className="w-5 h-5" /> Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scan History */}
                {scanHistory.length > 0 && (
                    <div className="mt-8 bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-secondary" /> Scan History
                            </h2>
                            <span className="text-xs text-gray-500 font-semibold">{scanHistory.length} scan{scanHistory.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {scanHistory.map((entry, i) => (
                                <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${entry.status === 'duplicate'
                                    ? 'bg-yellow-500/5 border-yellow-500/20'
                                    : 'bg-black/30 border-white/5'
                                    }`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        {entry.status === 'duplicate' ? (
                                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle className="w-4 h-4 text-yellow-500" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{entry.data.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{entry.data.events.join(', ')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-[10px] text-gray-500 font-mono">{entry.time}</p>
                                        <p className={`text-[10px] font-bold uppercase ${entry.status === 'duplicate' ? 'text-yellow-500' : 'text-green-500'
                                            }`}>
                                            {entry.status === 'duplicate' ? 'Re-scan' : 'Verified'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
