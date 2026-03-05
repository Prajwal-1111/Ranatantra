import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { SCHEDULE } from '../constants';

const FloatingShape = ({ position, color }: { position: [number, number, number], color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>
    </Float>
  );
};

const Background3D = () => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <FloatingShape position={[-5, 2, -10]} color="#ff0055" />
        <FloatingShape position={[5, -2, -15]} color="#00ffff" />
        <FloatingShape position={[0, 5, -20]} color="#ffd700" />
        <FloatingShape position={[-8, -5, -12]} color="#00ff00" />
        <FloatingShape position={[8, 3, -18]} color="#ff00ff" />
      </Canvas>
    </div>
  );
};

const Schedule: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress: globalScroll } = useScroll();
  const { scrollYProgress: timelineProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"]
  });

  const scaleX = useSpring(globalScroll, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const lineScaleY = useSpring(timelineProgress, {
    stiffness: 100,
    damping: 30
  });

  return (
    <div className="relative pt-24 min-h-screen bg-transparent overflow-x-clip">
      <Background3D />

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Scroll Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary z-[60] origin-left"
          style={{ scaleX }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-bold text-white mb-8 md:mb-16 text-center font-mono tracking-tighter text-glow drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          >
            TIMELINE
          </motion.h1>

          <div ref={containerRef} className="space-y-16 relative">
            {SCHEDULE.map((day, dayIndex) => (
              <motion.div
                key={dayIndex}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: dayIndex * 0.2 }}
                className="relative"
              >
                <div className="sticky top-24 z-10 bg-darker/60 backdrop-blur-xl py-4 mb-8 border-b border-white/10 rounded-xl px-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-mono">
                    {day.day}
                  </h2>
                </div>

                <div className="space-y-8 relative ml-3 md:ml-6 pl-8 md:pl-12 pb-4">
                  {/* Animated Vertical Line */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-transparent origin-top z-0 shadow-[0_0_10px_rgba(255,0,85,0.8)]"
                    style={{ scaleY: lineScaleY }}
                  />
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/5 z-0" />
                  {day.events.map((event, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="relative group"
                    >
                      {/* Timeline Dot */}
                      <motion.div
                        whileHover={{ scale: 1.5 }}
                        className="absolute -left-[41px] md:-left-[57px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-4 border-darker bg-gray-600 group-hover:bg-primary group-hover:shadow-[0_0_15px_rgba(255,0,85,1)] transition-all duration-300 z-10"
                      />

                      <motion.div
                        whileHover={{ x: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        className="bg-card/20 p-4 md:p-6 rounded-2xl border border-white/5 hover:border-secondary/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group-hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] backdrop-blur-md"
                      >
                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-secondary transition-colors drop-shadow-md">{event.title}</h3>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-primary whitespace-nowrap group-hover:border-primary/50 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                        >
                          {event.time}
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
