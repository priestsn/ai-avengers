import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import HaridDigitalAvatarFallback from "./HaridDigitalAvatar";

interface HaridAvatar3DProps {
  speaking: boolean;
  thinking: boolean;
  listening: boolean;
  listeningLabel?: string;
}

function Head({ speaking, thinking, listening }: { speaking: boolean; thinking: boolean; listening: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const leftLidRef = useRef<THREE.Mesh>(null);
  const rightLidRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  const blinkRef = useRef(0);
  const nextBlinkRef = useRef(2 + Math.random() * 4);
  const mouthPhaseRef = useRef(0);
  const thinkPhaseRef = useRef(0);
  const nodPhaseRef = useRef(0);
  const breathPhaseRef = useRef(0);

  const skinColor = useMemo(() => new THREE.Color("#d4a574"), []);
  const hairColor = useMemo(() => new THREE.Color("#1a1a2e"), []);
  const lipColor = useMemo(() => new THREE.Color("#c0584a"), []);
  const eyeWhite = useMemo(() => new THREE.Color("#f0f0f0"), []);
  const irisColor = useMemo(() => new THREE.Color("#1e3a5f"), []);
  const suitColor = useMemo(() => new THREE.Color("#1e293b"), []);
  const shirtColor = useMemo(() => new THREE.Color("#f8f8f0"), []);
  const tieColor = useMemo(() => new THREE.Color("#3b4d6b"), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    breathPhaseRef.current += delta * 0.8;
    const breathY = Math.sin(breathPhaseRef.current) * 0.02;
    groupRef.current.position.y = breathY;

    blinkRef.current += delta;
    if (blinkRef.current >= nextBlinkRef.current) {
      blinkRef.current = 0;
      nextBlinkRef.current = 2 + Math.random() * 4;
    }

    const blinkProgress = blinkRef.current;
    const isBlinking = blinkProgress < 0.12;
    const lidScale = isBlinking ? Math.max(0.05, 1 - (blinkProgress / 0.06)) : Math.min(1, (blinkProgress - 0.06) / 0.06);

    if (leftLidRef.current) leftLidRef.current.scale.y = lidScale;
    if (rightLidRef.current) rightLidRef.current.scale.y = lidScale;

    if (speaking) {
      mouthPhaseRef.current += delta * 12;
      const base = Math.sin(mouthPhaseRef.current) * 0.5 + 0.5;
      const noise = Math.sin(mouthPhaseRef.current * 2.7) * 0.3;
      const openAmount = Math.max(0.05, Math.min(1, base + noise));
      if (mouthRef.current) {
        mouthRef.current.scale.y = 0.3 + openAmount * 0.9;
        mouthRef.current.scale.x = 1.0 + openAmount * 0.15;
      }
    } else {
      if (mouthRef.current) {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.25, delta * 8);
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1.0, delta * 8);
      }
    }

    if (thinking) {
      thinkPhaseRef.current += delta * 1.5;
      const px = Math.sin(thinkPhaseRef.current) * 0.04;
      const py = Math.cos(thinkPhaseRef.current * 0.7) * 0.02;
      if (leftPupilRef.current) {
        leftPupilRef.current.position.x = -0.2 + px;
        leftPupilRef.current.position.y = 0.45 + py;
      }
      if (rightPupilRef.current) {
        rightPupilRef.current.position.x = 0.2 + px;
        rightPupilRef.current.position.y = 0.45 + py;
      }
    } else {
      if (leftPupilRef.current) {
        leftPupilRef.current.position.x = THREE.MathUtils.lerp(leftPupilRef.current.position.x, -0.2, delta * 4);
        leftPupilRef.current.position.y = THREE.MathUtils.lerp(leftPupilRef.current.position.y, 0.45, delta * 4);
      }
      if (rightPupilRef.current) {
        rightPupilRef.current.position.x = THREE.MathUtils.lerp(rightPupilRef.current.position.x, 0.2, delta * 4);
        rightPupilRef.current.position.y = THREE.MathUtils.lerp(rightPupilRef.current.position.y, 0.45, delta * 4);
      }
    }

    if (listening && !speaking) {
      nodPhaseRef.current += delta * 2.5;
      groupRef.current.rotation.x = Math.sin(nodPhaseRef.current) * 0.04;
    } else {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 3);
    }
  });

  const noseGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.06);
    shape.lineTo(0.04, -0.06);
    shape.quadraticCurveTo(0, -0.08, -0.04, -0.06);
    shape.lineTo(0, 0.06);
    const extSettings = { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 };
    return new THREE.ExtrudeGeometry(shape, extSettings);
  }, []);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.05} />
      </mesh>

      <mesh position={[0, 0.65, -0.05]} scale={[1.05, 0.7, 1]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.72, 0.05]} scale={[0.9, 0.35, 0.85]}>
        <sphereGeometry args={[0.48, 32, 16]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
      <mesh position={[-0.46, 0.35, 0]} scale={[0.15, 0.55, 0.4]}>
        <sphereGeometry args={[0.48, 16, 16]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.46, 0.35, 0]} scale={[0.15, 0.55, 0.4]}>
        <sphereGeometry args={[0.48, 16, 16]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>

      <group position={[-0.2, 0.45, 0.38]}>
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={eyeWhite} roughness={0.3} />
        </mesh>
        <mesh ref={leftPupilRef} position={[0, 0, 0.04]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color={irisColor} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="black" roughness={0.1} />
        </mesh>
        <mesh ref={leftLidRef} position={[0, 0.04, 0.02]} scale={[1.3, 1, 1]}>
          <boxGeometry args={[0.16, 0.04, 0.08]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      </group>

      <group position={[0.2, 0.45, 0.38]}>
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={eyeWhite} roughness={0.3} />
        </mesh>
        <mesh ref={rightPupilRef} position={[0, 0, 0.04]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color={irisColor} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="black" roughness={0.1} />
        </mesh>
        <mesh ref={rightLidRef} position={[0, 0.04, 0.02]} scale={[1.3, 1, 1]}>
          <boxGeometry args={[0.16, 0.04, 0.08]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      </group>

      <mesh ref={leftBrowRef} position={[-0.2, 0.56, 0.38]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.14, 0.02, 0.03]} />
        <meshStandardMaterial color={hairColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.2, 0.56, 0.38]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.14, 0.02, 0.03]} />
        <meshStandardMaterial color={hairColor} roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.3, 0.42]} rotation={[-0.3, 0, 0]} geometry={noseGeo}>
        <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.05} />
      </mesh>

      <mesh ref={mouthRef} position={[0, 0.18, 0.42]} scale={[1, 0.25, 1]}>
        <sphereGeometry args={[0.08, 16, 8]} />
        <meshStandardMaterial color={lipColor} roughness={0.5} />
      </mesh>

      <mesh position={[-0.37, 0.3, 0.1]} scale={[0.12, 0.15, 0.1]}>
        <sphereGeometry args={[0.48, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0.37, 0.3, 0.1]} scale={[0.12, 0.15, 0.1]}>
        <sphereGeometry args={[0.48, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.05} />
      </mesh>

      <mesh position={[0, -0.1, 0.1]} scale={[0.15, 0.2, 0.12]}>
        <cylinderGeometry args={[0.5, 0.7, 1, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.05} />
      </mesh>

      <mesh position={[0, -0.45, 0]} scale={[1, 0.7, 0.7]}>
        <sphereGeometry args={[0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={suitColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[0, -0.25, 0.28]} scale={[0.25, 0.15, 0.1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={shirtColor} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -0.35, 0.29]} scale={[0.06, 0.2, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={tieColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

function StatusIndicator({ speaking, thinking, listening }: { speaking: boolean; thinking: boolean; listening: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);

  const activeColor = useMemo(() => {
    if (speaking) return new THREE.Color("#3b82f6");
    if (thinking) return new THREE.Color("#eab308");
    if (listening) return new THREE.Color("#22c55e");
    return new THREE.Color("#3b82f6").multiplyScalar(0.3);
  }, [speaking, thinking, listening]);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    phaseRef.current += delta * 2;
    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    if (speaking || thinking || listening) {
      const pulse = 0.5 + Math.sin(phaseRef.current) * 0.5;
      mat.emissiveIntensity = 0.3 + pulse * 0.7;
      mat.opacity = 0.4 + pulse * 0.4;
    } else {
      mat.emissiveIntensity = 0.1;
      mat.opacity = 0.15;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.6, 0.015, 8, 64]} />
      <meshStandardMaterial
        color={activeColor}
        emissive={activeColor}
        emissiveIntensity={0.5}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { positions, velocities } = useMemo(() => {
    const count = 40;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 - 1;
      vel[i * 3] = (Math.random() - 0.5) * 0.1;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.1 + 0.05;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i) + velocities[i * 3] * delta;
      let y = posAttr.getY(i) + velocities[i * 3 + 1] * delta;
      let z = posAttr.getZ(i) + velocities[i * 3 + 2] * delta;
      if (y > 1.5) { y = -1.5; x = (Math.random() - 0.5) * 3; }
      if (Math.abs(x) > 1.5) velocities[i * 3] *= -1;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#3b82f6" size={0.02} transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

function Scene({ speaking, thinking, listening }: { speaking: boolean; thinking: boolean; listening: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-2, 1, 3]} intensity={0.3} color="#93c5fd" />
      <pointLight position={[0, -1, 2]} intensity={0.2} color="#3b82f6" />

      <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.1}>
        <Head speaking={speaking} thinking={thinking} listening={listening} />
        <StatusIndicator speaking={speaking} thinking={thinking} listening={listening} />
      </Float>

      <ParticleField />
    </>
  );
}

export default function HaridAvatar3D({
  speaking,
  thinking,
  listening,
  listeningLabel = "In ascolto",
}: HaridAvatar3DProps) {
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setWebGLAvailable(false);
    } catch {
      setWebGLAvailable(false);
    }
  }, []);

  if (!webGLAvailable) {
    return <HaridDigitalAvatarFallback speaking={speaking} thinking={thinking} listening={listening} listeningLabel={listeningLabel} />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0a0f1a] via-[#111827] to-[#0a0f1a]">
      <Canvas
        camera={{ position: [0, 0.15, 1.8], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "default" }}
        dpr={[1, 1.5]}
        frameloop="always"
        style={{ width: "100%", height: "100%" }}
      >
        <Scene speaking={speaking} thinking={thinking} listening={listening} />
      </Canvas>

      {speaking && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-[3px] pointer-events-none z-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-blue-400/70 animate-pulse"
              style={{
                height: `${8 + Math.random() * 12}px`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: `${0.4 + Math.random() * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {thinking && (
        <div className="absolute top-3 right-3 flex gap-1 pointer-events-none z-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-yellow-400/70 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}

      {listening && !speaking && !thinking && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 z-10">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400/80 font-medium">{listeningLabel}</span>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" />
    </div>
  );
}
