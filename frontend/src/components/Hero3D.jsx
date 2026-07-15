import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox, Float, Sparkles, Stars, ContactShadows } from "@react-three/drei";

const GOLD = "#ffb000";

function AccessCard() {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    const { x, y } = state.pointer;
    group.current.rotation.y += (x * 0.6 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-y * 0.4 - group.current.rotation.x) * 0.05;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.7}>
      <group ref={group} rotation={[0.12, -0.35, 0]}>
        <RoundedBox args={[3.2, 2.0, 0.14]} radius={0.09} smoothness={8}>
          <meshStandardMaterial color="#141416" metalness={1} roughness={0.3} />
        </RoundedBox>
        <mesh position={[-0.9, 0.4, 0.08]}>
          <boxGeometry args={[0.58, 0.46, 0.04]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} emissive={GOLD} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.66, 0.08]}>
          <boxGeometry args={[2.8, 0.15, 0.03]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} emissive={GOLD} emissiveIntensity={0.3} />
        </mesh>
        {[-0.05, 0.18, 0.4].map((y, i) => (
          <mesh key={i} position={[0.55, y, 0.08]}>
            <boxGeometry args={[1.6, 0.085, 0.02]} />
            <meshStandardMaterial color="#26262a" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Coin({ position, delay = 0 }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 1.1 + delay;
  });
  return (
    <Float speed={2.2} rotationIntensity={0.6} floatIntensity={2.4}>
      <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.09, 40]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.18} emissive={GOLD} emissiveIntensity={0.3} />
      </mesh>
    </Float>
  );
}

function Gem({ position }) {
  return (
    <Float speed={1.8} rotationIntensity={1.4} floatIntensity={2.2}>
      <mesh position={position}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.9} roughness={0.15} emissive={GOLD} emissiveIntensity={0.12} />
      </mesh>
    </Float>
  );
}

function KeyToken({ position }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.8;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={2}>
      <group ref={ref} position={position}>
        <mesh>
          <torusGeometry args={[0.28, 0.09, 16, 40]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} emissive={GOLD} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0.14, -0.72, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.12]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
        </mesh>
      </group>
    </Float>
  );
}

function Scene() {
  const cluster = useRef();
  useFrame((s) => {
    if (cluster.current) cluster.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.15) * 0.25;
  });
  return (
    <group ref={cluster}>
      <AccessCard />
      <Coin position={[-3.2, 1.4, -1]} />
      <Coin position={[3.0, -1.6, -0.5]} delay={2} />
      <Gem position={[3.2, 1.7, -1.5]} />
      <Gem position={[-2.9, -1.4, -1]} />
      <KeyToken position={[2.6, 0.4, 0.6]} />
      <KeyToken position={[-2.4, 0.6, 0.4]} />
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.18} />
      <directionalLight position={[4, 6, 4]} intensity={2.6} color={GOLD} />
      <directionalLight position={[-6, -2, 3]} intensity={1} color="#ffffff" />
      <spotLight position={[0, 5, 7]} intensity={1.6} angle={0.5} penumbra={1} color={GOLD} />
      <Suspense fallback={null}>
        <Scene />
        <Sparkles count={80} scale={12} size={2.4} speed={0.4} color={GOLD} opacity={0.7} />
        <Stars radius={40} depth={30} count={900} factor={3} saturation={0} fade speed={1} />
        <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={16} blur={3} far={5} color="#000000" />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
