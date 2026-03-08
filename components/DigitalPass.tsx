import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Share2, Check, Ticket, Calendar, MapPin, Shield } from 'lucide-react';

interface DigitalPassProps {
    user: { name: string; email: string; picture: string };
    registrations: any[];
    onClose: () => void;
}

const DigitalPass: React.FC<DigitalPassProps> = ({ user, registrations, onClose }) => {
    const passRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate a unique pass ID from user email + timestamp hash
    const passId = registrations.length > 0 && registrations[0].registrationId
        ? registrations[0].registrationId
        : `PASS-${btoa(user.email).slice(0, 8).toUpperCase()}`;

    // QR data contains all essential info for scanning
    const qrData = JSON.stringify({
        type: 'RANATANTRA_PASS',
        passId,
        name: user.name,
        email: user.email,
        events: registrations.map(r => r.title),
        registrationIds: registrations.map(r => r.registrationId).filter(Boolean),
        generatedAt: new Date().toISOString(),
    });

    const handleDownload = async () => {
        if (!passRef.current) return;
        setDownloading(true);

        try {
            // Wait for images to load
            const images = passRef.current.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            // Wait for QR Canvas to be fully ready
            await new Promise(resolve => setTimeout(resolve, 1000));

            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(passRef.current, {
                backgroundColor: '#0a0015',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                imageTimeout: 0,
                onclone: (clonedDoc) => {
                    const clonedPass = clonedDoc.querySelector('.pass-capture-area') as HTMLElement;
                    if (clonedPass) {
                        // Force a fixed width for the capture to ensure layout stability
                        clonedPass.style.width = '380px';
                        clonedPass.style.transform = 'none';
                        clonedPass.style.boxShadow = 'none';
                        clonedPass.style.position = 'relative';

                        // 1. Hide problematic glows
                        const toHide = clonedPass.querySelectorAll('.pass-hide-on-capture');
                        toHide.forEach((g: any) => g.style.display = 'none');

                        // 2. Clean functional elements
                        const toClean = clonedPass.querySelectorAll('.pass-clean-on-capture');
                        toClean.forEach((g: any) => {
                            g.style.boxShadow = 'none';
                            g.style.filter = 'none';
                        });

                        // 3. Fix Images (Ensure they are sized correctly)
                        const jgiLogo = clonedPass.querySelector('img[alt="JGI Logo"]') as HTMLElement;
                        if (jgiLogo) {
                            jgiLogo.style.height = '40px';
                            jgiLogo.style.width = 'auto';
                        }

                        // 4. Fix QR Canvas — replace cloned canvas with an img of the original data
                        const originalCanvases = passRef.current!.querySelectorAll('canvas');
                        const clonedCanvases = clonedPass.querySelectorAll('canvas');
                        originalCanvases.forEach((orig, idx) => {
                            const cloned = clonedCanvases[idx] as HTMLCanvasElement;
                            if (cloned && cloned.parentNode) {
                                const img = clonedDoc.createElement('img');
                                img.src = orig.toDataURL('image/png');
                                img.width = orig.width;
                                img.height = orig.height;
                                img.style.width = cloned.style.width || `${orig.width}px`;
                                img.style.height = cloned.style.height || `${orig.height}px`;
                                img.style.display = 'block';
                                cloned.parentNode.replaceChild(img, cloned);
                            }
                        });
                    }
                }
            });

            const link = document.createElement('a');
            link.download = `Ranatantra-Pass-${user.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Download failed:', err);
        }
        setDownloading(false);
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Ranatantra Digital Pass',
                    text: `Check out my digital pass for Ranatantra at JCET Hubballi! I'm registered for ${registrations.length} event(s).`,
                    url: window.location.origin,
                });
            } else {
                await navigator.clipboard.writeText(
                    `🎫 My Ranatantra Digital Pass\n👤 ${user.name}\n📧 ${user.email}\n🎯 Events: ${registrations.map(r => r.title).join(', ')}\n🔗 ${window.location.origin}`
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mb-3">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary/20 border border-secondary/40 text-secondary rounded-xl text-sm font-bold hover:bg-secondary/30 transition-all"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Share'}
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/40 text-primary rounded-xl text-sm font-bold hover:bg-primary/30 transition-all disabled:opacity-50"
                    >
                        <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                        {downloading ? 'Saving...' : 'Download'}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* The Pass Card */}
                <div ref={passRef} className="pass-capture-area bg-gradient-to-br from-[#0a0015] via-[#120024] to-[#0a0015] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(255,0,85,0.15)]">
                    {/* Top Gradient Bar */}
                    <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-secondary"></div>

                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 text-center relative">
                        {/* Background glow */}
                        <div className="pass-hide-on-capture absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="relative">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <img
                                    src="/jgi-logo.png"
                                    alt="JGI Logo"
                                    className="h-10 w-auto object-contain"
                                />
                                <img
                                    src="/logo.png"
                                    alt="Ranatantra"
                                    className="h-16 w-auto object-contain"
                                />
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/15 border border-secondary/30 rounded-full text-secondary text-[10px] font-bold tracking-widest uppercase">
                                <Shield className="w-3 h-3" />
                                Digital Entry Pass
                            </div>
                        </div>
                    </div>

                    {/* Dotted Separator */}
                    <div className="relative mx-6">
                        <div className="border-t-2 border-dashed border-white/10"></div>
                        <div className="absolute -left-9 -top-3 w-6 h-6 bg-[#0a0015] rounded-full"></div>
                        <div className="absolute -right-9 -top-3 w-6 h-6 bg-[#0a0015] rounded-full"></div>
                    </div>

                    {/* Participant Info */}
                    <div className="px-6 py-5">
                        <div className="flex items-center gap-4 mb-5">
                            <img
                                src={user.picture}
                                alt={user.name}
                                className="pass-clean-on-capture w-16 h-16 rounded-2xl border-2 border-primary/50 object-cover shadow-[0_0_20px_rgba(255,0,85,0.3)]"
                                referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                                <h2 className="text-xl font-black text-white truncate">{user.name}</h2>
                                <p className="text-sm text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="space-y-2 mb-5">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Calendar className="w-4 h-4 text-secondary shrink-0" />
                                <span className="font-semibold">March 27, 2026</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <MapPin className="w-4 h-4 text-secondary shrink-0" />
                                <span>JCET, Hubballi</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Ticket className="w-4 h-4 text-secondary shrink-0" />
                                <span>{registrations.length} Event{registrations.length !== 1 ? 's' : ''} Registered</span>
                            </div>
                        </div>

                        {/* Registered Events List */}
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Registered Events</p>
                            <div className="space-y-1.5">
                                {registrations.map((reg, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-white font-semibold truncate mr-2">{reg.title}</span>
                                        {reg.registrationId && (
                                            <span className="text-gray-500 font-mono text-[10px] shrink-0">{reg.registrationId}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dotted Separator */}
                    <div className="relative mx-6">
                        <div className="border-t-2 border-dashed border-white/10"></div>
                        <div className="absolute -left-9 -top-3 w-6 h-6 bg-[#0a0015] rounded-full"></div>
                        <div className="absolute -right-9 -top-3 w-6 h-6 bg-[#0a0015] rounded-full"></div>
                    </div>

                    {/* QR Code Section */}
                    <div className="px-6 py-6 text-center">
                        <div className="pass-clean-on-capture bg-white rounded-2xl p-4 inline-block shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <QRCodeCanvas
                                value={qrData}
                                size={180}
                                level="H"
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#0a0015"
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-3 font-semibold tracking-wider uppercase">
                            Scan at venue for entry verification
                        </p>
                        <p className="text-[10px] text-gray-600 mt-1 font-mono">{passId}</p>
                    </div>

                    {/* Bottom Gradient Bar */}
                    <div className="h-1.5 bg-gradient-to-r from-secondary via-primary to-purple-500"></div>
                </div>
            </div>
        </div>
    );
};

export default DigitalPass;
