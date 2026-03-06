import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
    onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isBooting, setIsBooting] = useState(true);

    // Fast aesthetic loading simulation
    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        setIsBooting(false);
                        setTimeout(onComplete, 1200); // Wait for exit animation
                    }, 800); // Complete animation hold
                    return 100;
                }
                // Accelerate near the end
                const jump = prev > 70 ? Math.random() * 20 + 10 : Math.random() * 10 + 2;
                return Math.min(prev + jump, 100);
            });
        }, 150);

        return () => clearInterval(progressInterval);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isBooting && (
                <motion.div
                    className="fixed inset-0 z-[9999] bg-darker flex flex-col items-center justify-center p-4 overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "brightness(0)" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    {/* Subtle animated background glow */}
                    <div className="absolute inset-0 z-0 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 0.15, scale: 1.2 }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                            className="w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-primary blur-[100px]"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Main Logo Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="mb-8 relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96"
                        >
                            {/* Outer glow ring */}
                            <motion.div
                                className="absolute inset-0 rounded-full border border-primary/30"
                                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                                transition={{ rotate: { duration: 8, ease: "linear", repeat: Infinity }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                                style={{ padding: '6px' }}
                            >
                                <div className="w-full h-full rounded-full border-t border-r border-primary blur-[1px]"></div>
                            </motion.div>

                            <motion.div
                                className="absolute inset-x-0 inset-y-0 m-auto w-3/4 h-3/4 flex items-center justify-center p-4 bg-dark/20 backdrop-blur-sm rounded-full"
                                animate={{
                                    filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img
                                    src="/logo.png"
                                    alt="Ranatantra Logo"
                                    className="max-w-full max-h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,0,85,0.4)]"
                                />
                            </motion.div>
                        </motion.div>

                        {/* Futuristic Loading Bar */}
                        <motion.div
                            className="w-64 md:w-80"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex justify-between items-end mb-2 px-1">
                                <span className="text-primary font-mono text-xs tracking-[0.2em] uppercase">Loading</span>
                                <span className="text-secondary font-mono text-xs tracking-wider">{Math.floor(progress)}%</span>
                            </div>

                            <div className="h-1.5 w-full bg-dark/50 border border-primary/20 rounded-full overflow-hidden relative backdrop-blur-sm">
                                <motion.div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "easeOut", duration: 0.2 }}
                                />

                                {/* Glossy overlay on progress bar */}
                                <div className="absolute inset-0 bg-white/10 w-full h-full"></div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BootSequence;
