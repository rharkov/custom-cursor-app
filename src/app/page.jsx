"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";

/* ---------- Media Query Hook ---------- */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query);
      if (media.matches !== matches) setMatches(media.matches);
      const listener = () => setMatches(media.matches);
      window.addEventListener("resize", listener);
      return () => window.removeEventListener("resize", listener);
    }
  }, [matches, query]);
  return matches;
};

/* ---------- Brands ---------- */
const brandLogos = [
  {
    name: "La Biosthetique",
    logoUrl: "/logos/BIO_LOGO.svg",
    description:
      "A holistic approach to beauty, combining scientific innovation with natural ingredients for hair and skin.",
  },
  {
    name: "Sothys",
    logoUrl: "/logos/S_LOGO.png",
    description:
      "A world of professional skincare with a Parisian heritage, dedicated to creating exclusive spa experiences.",
  },
  {
    name: "Wherteimar",
    logoUrl: "/logos/W_LOGO.png",
    description:
      "Swiss-quality cellular cosmetics specializing in powerful anti-aging treatments for luxurious results.",
  },
];

/* ---------- Coin ---------- */
const Coin = ({ brand, position, size, isActive, isMobile, onClick }) => {
  const groupRef = useRef(null);
  const [hovered, setHover] = useState(false);
  const [frontTexture, setFrontTexture] = useState(null);
  const [backTexture, setBackTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(brand.logoUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      setFrontTexture(texture);
    });
  }, [brand.logoUrl]);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const canvasSize = 1024;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#f5f5dc";
    ctx.font = "bold 80px 'Poppins', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = brand.description;
    const maxWidth = canvasSize * 0.86;
    const lineHeight = 88;
    const words = text.split(" ");
    let line = "";
    const lines = [];
    words.forEach((word) => {
      const testLine = line + word + " ";
      if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
        lines.push(line);
        line = word + " ";
      } else {
        line = testLine;
      }
    });
    lines.push(line);
    const startY = canvasSize / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) =>
      ctx.fillText(l.trim(), canvasSize / 2, startY + i * lineHeight)
    );
    setBackTexture(new THREE.CanvasTexture(canvas));
  }, [brand.description]);

  const { flip, scale } = useSpring({
    flip: hovered || isActive ? 1 : 0,
    scale: hovered || isActive ? 1.15 : 1,
    config: { mass: 1, tension: 400, friction: 30 },
  });

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  }, [position]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(t * 1.5 + position[0]) * 0.1;
    }
  });

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <a.group
      ref={groupRef}
      scale={scale}
      onPointerOver={() => !isMobile && setHover(true)}
      onPointerOut={() => !isMobile && setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh position-z={0.05}>
        <circleGeometry args={[size / 2, 64]} />
        {frontTexture && (
          <a.meshStandardMaterial
            map={frontTexture}
            transparent
            depthWrite={false}
            opacity={flip.to((v) => 1 - v)}
            side={THREE.DoubleSide}
            color="#f5f5dc"
          />
        )}
      </mesh>
      <mesh position-z={-0.05} rotation-y={Math.PI}>
        <circleGeometry args={[size / 2, 64]} />
        {backTexture && (
          <a.meshStandardMaterial
            map={backTexture}
            transparent
            depthWrite={false}
            opacity={flip}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
      <mesh position-z={0.002}>
        <ringGeometry args={[size * 0.48, size * 0.51, 128]} />
        <meshStandardMaterial
          color="#b8860b"
          metalness={0.9}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </a.group>
  );
};

/* ---------- Coins layout & sizing ---------- */
const CoinsContainer = () => {
  const { viewport } = useThree();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeCoin, setActiveCoin] = useState(null);

  const positions = useMemo(() => {
    const n = brandLogos.length;
    const W = viewport.width;
    const H = viewport.height;
    if (isMobile) {
      const coinSize = Math.min(H * 0.5, 9);
      const y = H * 0.12;
      return brandLogos.map((_, i) => ({
        position: [-W / 2 + ((i + 1) / (n + 1)) * W, y, 0],
        size: coinSize,
      }));
    } else {
      const coinSize = Math.min(H * 0.65, 12);
      const y = H * 0.14;
      return brandLogos.map((_, i) => ({
        position: [-W / 2 + ((i + 1) / (n + 1)) * W, y, 0],
        size: coinSize,
      }));
    }
  }, [isMobile, viewport.width, viewport.height]);

  return (
    <group onClick={() => setActiveCoin(null)}>
      {positions.map((props, i) => (
        <Coin
          key={brandLogos[i].name}
          brand={brandLogos[i]}
          {...props}
          isActive={activeCoin === i}
          isMobile={isMobile}
          onClick={() => setActiveCoin(activeCoin === i ? null : i)}
        />
      ))}
    </group>
  );
};

/* ---------- Page ---------- */
export default function HomePage() {
  return (
    // CHANGE 1: Add flexbox classes HERE to center the content
    <section className="relative flex min-h-dvh w-screen items-center justify-center">
      <Canvas
        className="absolute inset-0 z-0 h-full w-full"
        camera={{ position: [0, 0, 15], fov: 40 }}
      >
        <color attach="background" args={["#f5f5dc"]} />
        <ambientLight intensity={1.4} />
        <pointLight position={[10, 10, 10]} intensity={2.5} color="#fff8e7" />
        <pointLight
          position={[-10, -10, -10]}
          intensity={1.0}
          color="#d1e3ff"
        />
        <CoinsContainer />
      </Canvas>

      {/* CHANGE 2: Remove the old fixed positioning classes from HERE */}
      <div className="pointer-events-none z-10 w-[min(92vw,1100px)] px-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-zinc-800 drop-shadow-md sm:text-6xl md:text-7xl lg:text-8xl">
            Welcome to the Expo 2025
          </h1>
          <p className="mt-6 max-w-4xl text-zinc-700/90 drop-shadow md:text-xl lg:text-2xl">
            Discover our exquisite brands: La Biosthetique, Sothys &amp;
            Wherteimar
          </p>
        </div>
      </div>
    </section>
  );
}
