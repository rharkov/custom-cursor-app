"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";

// You must place these logo images in your `public` directory
const brandLogos = [
  {
    name: "La Biosthetique",
    logoUrl: "/logos/BIO_LOGO.svg", // Updated to match your filename
    description:
      "A holistic approach to biological beauty, combining scientific innovation with natural ingredients for hair and skin.",
    color: "#84cc16",
  },
  {
    name: "Sothys",
    logoUrl: "/logos/S_LOGO.png", // Updated to match your filename
    description:
      "A world of sensorial, professional skincare with a Parisian heritage, dedicated to creating exclusive spa experiences.",
    color: "#e879f9",
  },
  {
    name: "Wherteimar",
    logoUrl: "/logos/W_LOGO.png", // Updated to match your filename
    description:
      "Swiss-quality cellular cosmetics specializing in powerful anti-aging treatments and high-end formulations for luxurious results.",
    color: "#38bdf8",
  },
];

const Coin = ({ brand, position }) => {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const [tapped, setTapped] = useState(false);

  // Animate the rotation and scale on hover/tap
  const { rotation, scale } = useSpring({
    rotation: [0, hovered || tapped ? Math.PI : 0, 0],
    scale: hovered || tapped ? 1.2 : 1,
    config: { mass: 1, tension: 500, friction: 50 },
  });

  // Use useFrame to make the coins float
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(clock.getElapsedTime() + position[0]) * 0.2;
    }
  });

  // Handle pointer events for both hover and tap
  const handlePointerOver = () => setHover(true);
  const handlePointerOut = () => setHover(false);
  const handlePointerDown = (e) => {
    // Prevent default to avoid blurring when tapping on mobile
    e.stopPropagation();
    setActive(!active);
    setTapped(!tapped);
  };

  const textureLoader = new THREE.TextureLoader();
  const frontTexture = textureLoader.load(brand.logoUrl);
  const backTexture = new THREE.CanvasTexture(document.createElement("canvas"));
  const canvas = backTexture.image;
  const ctx = canvas.getContext("2d");

  // Create the brand info text on a canvas
  canvas.width = 512;
  canvas.height = 512;
  ctx.fillStyle = brand.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const text = brand.description.split(" ");
  const lineHeight = 40;
  let lines = [];
  let currentLine = "";

  for (let i = 0; i < text.length; i++) {
    let testLine = currentLine + text[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > canvas.width * 0.8 && i > 0) {
      lines.push(currentLine);
      currentLine = text[i] + " ";
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  lines.forEach((line, index) => {
    ctx.fillText(
      line,
      canvas.width / 2,
      canvas.height / 2 -
        ((lines.length - 1) * lineHeight) / 2 +
        index * lineHeight
    );
  });

  backTexture.needsUpdate = true;

  return (
    <animated.mesh
      position={position}
      ref={meshRef}
      rotation={rotation}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
    >
      <cylinderGeometry args={[1, 1, 0.2, 32]} />
      {/* Front of the coin with logo */}
      <meshStandardMaterial map={frontTexture} transparent />
      {/* Back of the coin with description */}
      <meshStandardMaterial map={backTexture} />
    </animated.mesh>
  );
};

const CoinsContainer = () => {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5; // A simple heuristic for mobile

  const positions = brandLogos.map((_, i) => [
    isMobile ? 0 : -3 + i * 3, // Stagger X positions on desktop
    -1 + Math.random() * 2, // Random Y position
    -5 - Math.random() * 5, // Random Z position
  ]);

  return (
    <>
      {brandLogos.map((brand, i) => (
        <Coin key={i} brand={brand} position={positions[i]} />
      ))}
    </>
  );
};

export default function ExpoPage() {
  return (
    <main className="fixed inset-0 bg-gray-950 text-white overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <OrbitControls />
        <CoinsContainer />
        <Html fullscreen>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-lime-400 drop-shadow-lg">
              Cosmetics Brand Expo
            </h1>
            <p className="mt-2 text-lg sm:text-xl md:text-2xl text-white drop-shadow-lg">
              Hover or tap on a brand to learn more.
            </p>
          </div>
        </Html>
      </Canvas>
    </main>
  );
}
