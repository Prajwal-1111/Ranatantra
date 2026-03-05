import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Terrain = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const size = 300;
    const segments = 100;

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(size, size, segments, segments);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        const speed = 12; // Adjust for momentum
        const offset = time * speed;

        const pos = meshRef.current.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);

            // Calculate world distance for procedural generation
            const worldZ = z - offset;

            // Combine sine waves to create chaotic mountainous terrain
            const elevation =
                Math.sin(x * 0.05) * Math.cos(worldZ * 0.05) * 6 +
                Math.sin(x * 0.1) * Math.cos(worldZ * 0.1) * 2 +
                Math.sin(x * 0.015) * Math.cos(worldZ * 0.01) * 15;

            pos.setY(i, elevation);
        }
        pos.needsUpdate = true;
    });

    return (
        <mesh ref={meshRef} position={[0, -18, -60]}>
            <primitive object={geometry} attach="geometry" />
            <meshBasicMaterial
                color="#8a2be2" // Beautiful dark purple/cyan blend can be made with two meshes, but basic purple works well
                wireframe={true}
                transparent={true}
                opacity={0.6}
            />
        </mesh>
    );
};

// Second terrain overlay for dual-color chaotic vibe (faint cyan lines over purple)
const TerrainOverlay = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const size = 300;
    const segments = 100;

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(size, size, segments, segments);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        const speed = 12; // Same speed
        const offset = time * speed;

        const pos = meshRef.current.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);

            const worldZ = z - offset;

            const elevation =
                Math.sin(x * 0.05) * Math.cos(worldZ * 0.05) * 6 +
                Math.sin(x * 0.1) * Math.cos(worldZ * 0.1) * 2 +
                Math.sin(x * 0.015) * Math.cos(worldZ * 0.01) * 15;

            // Slightly offset Y to avoid total z-fighting but overlay nicely
            pos.setY(i, elevation - 0.2);
        }
        pos.needsUpdate = true;
    });

    return (
        <mesh ref={meshRef} position={[0, -18, -60]}>
            <primitive object={geometry} attach="geometry" />
            <meshBasicMaterial
                color="#00e5ff" // Cyan accent
                wireframe={true}
                transparent={true}
                opacity={0.15}
            />
        </mesh>
    );
};

const CyberpunkTerrain: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <Canvas camera={{ position: [0, 2, 25], fov: 70 }}>
                {/* The fog blends the terrain seamlessly into the dark background (#05000a) */}
                <fog attach="fog" args={['#05000a', 20, 120]} />
                <ambientLight intensity={1} />
                <Terrain />
                <TerrainOverlay />
            </Canvas>
        </div>
    );
};

export default CyberpunkTerrain;
