"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";

const SpinningOrb = () => {
  const meshRef = useRef();

  // Rotate the orb on every frame
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Sphere args={[1.5, 32, 32]} ref={meshRef}>
      <meshStandardMaterial
        color="#84cc16"
        transparent
        opacity={0.5}
        wireframe={true}
      />
    </Sphere>
  );
};

const ThreeJSBackground = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <OrbitControls enableZoom={false} enablePan={false} />
        <SpinningOrb />
      </Canvas>
    </div>
  );
};

export default ThreeJSBackground;
