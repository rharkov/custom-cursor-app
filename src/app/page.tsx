"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber"; // Removed Group import
import { a, useSpring } from "@react-spring/three";
import * as THREE from "three";
import { Literata, Inter } from "next/font/google";

const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-literata",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Assume Schnyder is imported and available as a variable, or fallback

// --- Type Definitions ---
interface Brand {
  name: string;
  logoUrl: string;
  description: string;
  borderColor: string;
}
interface CoinProps {
  brand: Brand;
  position: [number, number, number];
  size: number;
  isActive: boolean;
  isMobile: boolean;
  isDark: boolean;
  onClick: () => void;
}

// --- Media Query Hook ---
const useMediaQuery = (query: string): boolean => {
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

// --- Brand Data ---
const brandLogos: Brand[] = [
  {
    name: "La Biosthetique",
    logoUrl: "/logos/BIO_LOGO.svg",
    description:
      "A holistic approach to beauty, combining scientific innovation with natural ingredients for hair and skin.",
    borderColor: "#2b1f1a", // rich cocoa
  },
  {
    name: "Sothys",
    logoUrl: "/logos/S_LOGO.png",
    description:
      "A world of professional skincare with a Parisian heritage, dedicated to creating exclusive spa experiences.",
    borderColor: "#0f2b3a", // deep parisian blue-green
  },
  {
    name: "Wherteimar",
    logoUrl: "/logos/W_LOGO.png",
    description:
      "Swiss-quality cellular cosmetics specializing in powerful anti-aging treatments for luxurious results.",
    borderColor: "#5a3d0c", // warm bronze
  },
];

// --- Per-brand sweep color mapping (unified Wherteimar gray/white tone) ---
const sweepColorFor = (_brand: Brand, isDark: boolean) =>
  isDark ? "#d9d9d9" : "#e6e6e6";

// --- Coin Component (with Spring) ---
const Coin = ({
  brand,
  position,
  size,
  isActive,
  isMobile,
  isDark,
  onClick,
}: CoinProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
  const [backTexture, setBackTexture] = useState<THREE.Texture | null>(null);
  const [hovered, setHovered] = useState(false);
  const highlightRef = useRef<THREE.Mesh>(null);

  // TS helper: animated material with relaxed prop types
  const AnimatedMeshStandardMaterial: any = a.meshStandardMaterial as any;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = brand.logoUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const S = 1024; // square working canvas
      canvas.width = S;
      canvas.height = S;

      const pad = S * 0.12; // 12% padding for cleaner look
      const targetW = S - pad * 2;
      const targetH = S - pad * 2;
      const scale = Math.min(targetW / img.width, targetH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (S - w) / 2;
      const y = (S - h) / 2;

      // Clip to circle to ensure edges are perfectly round
      ctx.save();
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S / 2 - pad / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, x, y, w, h);
      if (isDark) {
        const imgData = ctx.getImageData(0, 0, S, S);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          // invert only non-transparent pixels
          if (data[i + 3] > 10) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
      ctx.restore();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      setFrontTexture(tex);
    };
  }, [brand.logoUrl, isDark]);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const canvasSize = 1024;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.fillStyle = isDark ? "#0e0e0e" : "#1a1a1a"; // rich charcoal
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Use Schnyder S Light or elegant serif fallback
    // The font variable may be injected via CSS or loaded elsewhere
    // Fallbacks: "Literata", "Cormorant Garamond", serif
    ctx.fillStyle = isDark ? "#f4ead1" : "#e6d8b4"; // warm champagne
    ctx.font =
      '300 74px "Schnyder S Light", "Literata", "Cormorant Garamond", serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = brand.description;
    const maxWidth = canvasSize * 0.78; // narrower for elegance
    const lineHeight = 84; // slightly tighter
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    words.forEach((word: string) => {
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
  }, [brand.description, isDark]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
    }
  }, [position]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(t * 1.5 + position[0]) * 0.1;
    }
  });

  // Always face the camera (billboard)
  useFrame(({ camera }) => {
    if (groupRef.current) groupRef.current.quaternion.copy(camera.quaternion);
  });

  // Neon arc: desktop-only, slow clockwise sweep
  useFrame(() => {
    if (!highlightRef.current) return;
    const show = !isMobile && hovered;
    highlightRef.current.visible = show;
    if (show) {
      highlightRef.current.rotation.z -= 0.02; // slower, clockwise
    }
  });

  // Separate springs: keep flip responsive; make scale slower & smoother
  const flipSpring = useSpring<{ flip: number }>({
    to: { flip: isActive ? 1 : 0 },
    config: { mass: 1, tension: 400, friction: 22 },
  });

  const scaleSpring = useSpring<{ s: number }>({
    to: { s: isActive ? 1.14 : !isMobile && hovered ? 1.06 : 1 },
    config: { mass: 2.1, tension: 130, friction: 30, precision: 0.0001 },
  });

  const frontOpacity = (flipSpring.flip as any).to((v: number) => 1 - v) as any;
  const backOpacity = flipSpring.flip as any;

  return (
    <a.group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      scale={scaleSpring.s}
    >
      {/* Flip via crossfade instead of physical rotation (avoids oval) */}
      <group>
        {/* front */}
        <mesh>
          <circleGeometry args={[size / 2, 64]} />
          {frontTexture && (
            <AnimatedMeshStandardMaterial
              map={frontTexture}
              transparent
              depthWrite={false}
              opacity={frontOpacity as any}
              side={THREE.DoubleSide}
              color="#ffffff"
            />
          )}
        </mesh>

        {/* back */}
        <mesh>
          <circleGeometry args={[size / 2, 64]} />
          {backTexture && (
            <AnimatedMeshStandardMaterial
              map={backTexture}
              transparent
              depthWrite={false}
              opacity={backOpacity as any}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>

        {/* border ring in the same plane */}
        <mesh position-z={0.002}>
          <ringGeometry args={[size * 0.485, size * 0.515, 128]} />
          <meshStandardMaterial
            color={isDark ? "#e6d8b4" : brand.borderColor}
            metalness={0.7}
            roughness={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* animated neon sweep on hover (desktop only) */}
        <mesh ref={highlightRef} position-z={0.004} visible={false}>
          {/* small arc; we rotate the whole mesh for motion */}
          <ringGeometry
            args={[size * 0.485, size * 0.515, 128, 1, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color={sweepColorFor(brand, isDark)}
            emissive={sweepColorFor(brand, isDark)}
            emissiveIntensity={0.65}
            metalness={0.15}
            roughness={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* hit area (smaller than visual) to avoid overlapping hovers */}
        <mesh
          position-z={0.006}
          onPointerOver={(e) => {
            e.stopPropagation();
            !isMobile && setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            !isMobile && setHovered(false);
          }}
        >
          <circleGeometry args={[size * 0.46, 64]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
    </a.group>
  );
};

// --- CoinsContainer ---
const CoinsContainer: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { viewport } = useThree();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeCoin, setActiveCoin] = useState<number | null>(null);

  const positions = useMemo(() => {
    const n = brandLogos.length;
    const W = viewport.width;
    const H = viewport.height; // world units within the canvas band

    // --- Vertical sizing constraints ---
    const marginTop = H * 0.12;
    const marginBottom = H * 0.12;
    const verticalMax = Math.max(H - (marginTop + marginBottom), 0.5);

    // --- Desired size from width for bold presence ---
    const desired = W * (isMobile ? 0.46 : 0.36);

    // --- Horizontal constraints: include left/right margins and gaps between coins ---
    const hMargin = W * 0.06; // side gutters
    const baseGapRatio = 0.16; // 16% of coin size spacing

    // We solve for a coin size that fits: n*size + (n-1)*gap <= (W - 2*hMargin)
    // where gap = baseGapRatio * size
    // => size * (n + (n-1)*baseGapRatio) <= (W - 2*hMargin)
    const denom = n + (n - 1) * baseGapRatio;
    const horizontalMax = (W - 2 * hMargin) / Math.max(denom, 0.0001);

    // Final coin size clamped by vertical/horizontal constraints and desired target
    const coinSize = Math.max(
      0.1,
      Math.min(desired, verticalMax, horizontalMax)
    );
    const gap = baseGapRatio * coinSize;

    // X positions: center the row exactly
    const rowWidth = n * coinSize + (n - 1) * gap;
    const startX = -rowWidth / 2 + coinSize / 2;
    const y = H / 2 - coinSize / 2 - marginTop; // snug under the top margin

    return brandLogos.map((_, i) => ({
      position: [startX + i * (coinSize + gap), y, 0] as [
        number,
        number,
        number
      ],
      size: coinSize,
    }));
  }, [isMobile, viewport.width, viewport.height]);

  return (
    <group onClick={() => setActiveCoin(null)}>
      {positions.map((props, i: number) => (
        <Coin
          key={brandLogos[i].name}
          brand={brandLogos[i]}
          {...props}
          isActive={activeCoin === i}
          isMobile={isMobile}
          isDark={isDark}
          onClick={() => setActiveCoin(activeCoin === i ? null : i)}
        />
      ))}
    </group>
  );
};

// --- Page Component ---
export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  return (
    <section
      className={`relative w-screen min-h-dvh ${literata.variable} ${inter.variable}`}
    >
      <button
        onClick={() => setIsDark((v) => !v)}
        className="fixed right-4 top-4 z-50 rounded-full border px-3 py-1 text-sm"
        style={{
          background: isDark ? "#1b1b1b" : "#ffffffbf",
          color: isDark ? "#e7e7e7" : "#111",
          borderColor: isDark ? "#2a2a2a" : "#ccc",
          backdropFilter: "saturate(140%) blur(6px)",
        }}
      >
        {isDark ? "Light" : "Dark"}
      </button>
      {/* TOP BAND: 3D coins, fixed height */}
      <div
        className="relative w-screen"
        style={{ height: "72vh", minHeight: 620 }}
      >
        <Canvas
          className="absolute inset-0 z-0 block"
          camera={{ position: [0, 0, 15], fov: 40 }}
        >
          <color attach="background" args={[isDark ? "#0f0f0f" : "#f5f5dc"]} />
          <ambientLight intensity={1.4} />
          <pointLight position={[10, 10, 10]} intensity={2.5} color="#fff8e7" />
          <pointLight
            position={[-10, -10, -10]}
            intensity={1.0}
            color="#d1e3ff"
          />
          <CoinsContainer isDark={isDark} />
        </Canvas>
      </div>

      {/* TEXT BLOCK: centered, with explicit top padding to create separation */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "2.5rem 1.5rem 6rem",
        }}
      >
        <div style={{ width: "min(92vw, 1100px)", textAlign: "center" }}>
          <h1
            className="text-center text-6xl sm:text-7xl md:text-8xl drop-shadow-md"
            style={{
              fontFamily:
                "var(--font-literata), 'Literata', 'Cormorant Garamond', 'Times New Roman', serif",
              fontWeight: 700,
              letterSpacing: "0.002em",
              lineHeight: 1.06,
              color: isDark ? "#f1f1f1" : "#242424",
            }}
          >
            Welcome to the Expo 2025
          </h1>
          <p
            className="font-sans mt-6 text-center max-w-3xl mx-auto text-base drop-shadow md:text-lg lg:text-xl"
            style={{
              fontFamily:
                "var(--font-inter), 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
              fontWeight: 500,
              letterSpacing: "0.01em",
              color: isDark ? "#cfcfcf" : "#3a3a3a",
            }}
          >
            Discover our exquisite brands: La Biosthetique, Sothys &amp;
            Wherteimar
          </p>
        </div>
      </div>
    </section>
  );
}
