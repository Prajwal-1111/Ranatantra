import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
    onComplete: () => void;
}

// Generate random particles once
const generateParticles = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 2,
        opacity: Math.random() * 0.6 + 0.2,
    }));

const STATUS_MESSAGES = [
    'INITIALIZING...',
    'LOADING ASSETS...',
    'CALIBRATING...',
    'ALMOST READY...',
    'WELCOME, COMMANDER.',
];

// Synthesize a subtle sci-fi boot sound via Web Audio API
const playBootSound = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // ── Layer 1: Rising sweep tone ──
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(180, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 1.2);
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        osc1.connect(gain1).connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.8);

        // ── Layer 2: Low sub-bass hum ──
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(60, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(80, ctx.currentTime + 2);
        gain2.gain.setValueAtTime(0.06, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 2.2);

        // ── Layer 3: High-pitched digital blip ──
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'square';
        osc3.frequency.setValueAtTime(1200, ctx.currentTime + 0.3);
        osc3.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
        gain3.gain.setValueAtTime(0, ctx.currentTime);
        gain3.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.3);
        gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc3.connect(gain3).connect(ctx.destination);
        osc3.start(ctx.currentTime + 0.3);
        osc3.stop(ctx.currentTime + 0.6);

        // Cleanup
        setTimeout(() => ctx.close(), 3000);
    } catch {
        // Silently fail — autoplay may be blocked
    }
};

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isBooting, setIsBooting] = useState(true);
    const [statusIndex, setStatusIndex] = useState(0);
    const particles = useMemo(() => generateParticles(30), []);

    // Play boot sound on mount
    useEffect(() => {
        playBootSound();
    }, []);

    // Progress bar simulation
    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        setIsBooting(false);
                        setTimeout(onComplete, 1000);
                    }, 800);
                    return 100;
                }
                const jump = prev > 70 ? Math.random() * 20 + 10 : Math.random() * 10 + 2;
                return Math.min(prev + jump, 100);
            });
        }, 150);

        return () => clearInterval(progressInterval);
    }, [onComplete]);

    // Cycle status messages based on progress
    useEffect(() => {
        if (progress < 20) setStatusIndex(0);
        else if (progress < 45) setStatusIndex(1);
        else if (progress < 70) setStatusIndex(2);
        else if (progress < 95) setStatusIndex(3);
        else setStatusIndex(4);
    }, [progress]);

    return (
        <AnimatePresence>
            {isBooting && (
                <motion.div
                    className="fixed inset-0 z-[9999] bg-darker flex flex-col items-center justify-center p-4 overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.08, filter: 'brightness(0)' }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                    {/* ── Floating Particles ── */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        {particles.map(p => (
                            <motion.div
                                key={p.id}
                                className="absolute rounded-full bg-primary"
                                style={{
                                    left: `${p.x}%`,
                                    top: `${p.y}%`,
                                    width: p.size,
                                    height: p.size,
                                }}
                                initial={{ opacity: 0, y: 0 }}
                                animate={{
                                    opacity: [0, p.opacity, 0],
                                    y: [0, -60 - Math.random() * 80],
                                    x: [0, (Math.random() - 0.5) * 40],
                                }}
                                transition={{
                                    duration: p.duration,
                                    delay: p.delay,
                                    repeat: Infinity,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </div>

                    {/* ── Background Glow ── */}
                    <div className="absolute inset-0 z-0 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 0.18, scale: 1.3 }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                            className="w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] rounded-full bg-primary blur-[120px]"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* ── Logo with Double Rings ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="mb-6 relative w-64 h-64 sm:w-80 sm:h-80 md:w-[22rem] md:h-[22rem] lg:w-[26rem] lg:h-[26rem]"
                        >
                            {/* Outer Ring — clockwise */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
                            >
                                <div
                                    className="w-full h-full rounded-full"
                                    style={{
                                        border: '1.5px solid transparent',
                                        borderTopColor: 'rgba(255, 0, 85, 0.6)',
                                        borderRightColor: 'rgba(255, 0, 85, 0.25)',
                                    }}
                                />
                            </motion.div>

                            {/* Inner Ring — counter-clockwise */}
                            <motion.div
                                className="absolute inset-3 sm:inset-4 rounded-full"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
                            >
                                <div
                                    className="w-full h-full rounded-full"
                                    style={{
                                        border: '1px solid transparent',
                                        borderBottomColor: 'rgba(0, 255, 255, 0.5)',
                                        borderLeftColor: 'rgba(0, 255, 255, 0.2)',
                                    }}
                                />
                            </motion.div>

                            {/* Pulsing glow behind the logo */}
                            <motion.div
                                className="absolute inset-8 sm:inset-10 rounded-full bg-primary/10 blur-xl"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            {/* Logo image — fills most of the circle */}
                            <motion.div
                                className="absolute inset-6 sm:inset-8 flex items-center justify-center rounded-full"
                                animate={{
                                    filter: ['brightness(1)', 'brightness(1.25)', 'brightness(1)'],
                                }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <img
                                    src="/logo.png"
                                    alt="Ranatantra Logo"
                                    className="max-w-full max-h-full object-contain drop-shadow-[0_0_25px_rgba(255,0,85,0.5)]"
                                />
                            </motion.div>
                        </motion.div>

                        {/* ── Animated Tagline ── */}
                        <motion.p
                            className="text-white/60 font-mono text-xs sm:text-sm tracking-widest mb-8 text-center italic"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            Ignite Your Passion. Freeze Your Fear.
                        </motion.p>

                        {/* ── Loading Bar ── */}
                        <motion.div
                            className="w-72 sm:w-80 md:w-96"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Status text + percentage */}
                            <div className="flex justify-between items-end mb-2 px-1">
                                <motion.span
                                    key={statusIndex}
                                    className="text-primary font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase"
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {STATUS_MESSAGES[statusIndex]}
                                </motion.span>
                                <span className="text-secondary font-mono text-[10px] sm:text-xs tracking-wider">
                                    {Math.floor(progress)}%
                                </span>
                            </div>

                            {/* Bar track */}
                            <div className="h-2 w-full bg-dark/60 border border-primary/20 rounded-full overflow-hidden relative backdrop-blur-sm">
                                {/* Filled portion */}
                                <motion.div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-pink-500 to-secondary rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: 'easeOut', duration: 0.2 }}
                                />

                                {/* Glowing leading edge */}
                                <motion.div
                                    className="absolute top-0 h-full w-4 bg-white/40 blur-sm rounded-full"
                                    initial={{ left: '0%' }}
                                    animate={{ left: `calc(${Math.min(progress, 98)}% - 8px)` }}
                                    transition={{ ease: 'easeOut', duration: 0.2 }}
                                />

                                {/* Glossy overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent rounded-full" />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BootSequence;
