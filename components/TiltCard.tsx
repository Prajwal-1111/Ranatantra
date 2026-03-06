import React, { useRef, useState } from 'react';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string; // e.g. 'rgba(255,0,85,0.4)'
    tiltIntensity?: number; // degrees of max tilt, default 8
}

const TiltCard: React.FC<TiltCardProps> = ({
    children,
    className = '',
    glowColor = 'rgba(255, 0, 85, 0.35)',
    tiltIntensity = 8,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Tilt calculation
        const rotateX = ((y - centerY) / centerY) * -tiltIntensity;
        const rotateY = ((x - centerX) / centerX) * tiltIntensity;

        setTransform(
            `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`
        );

        // Glow follows cursor position (percentage)
        setGlowPos({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100,
        });
    };

    const handleMouseEnter = () => setIsHovering(true);

    const handleMouseLeave = () => {
        setIsHovering(false);
        setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
        setGlowPos({ x: 50, y: 50 });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative ${className}`}
            style={{
                transform,
                transition: isHovering
                    ? 'transform 0.1s ease-out'
                    : 'transform 0.5s cubic-bezier(0.33, 1, 0.68, 1)',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}
        >
            {children}
        </div>
    );
};

export default TiltCard;
