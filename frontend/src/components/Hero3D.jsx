import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars, ContactShadows, MeshDistortMaterial, Environment } from "@react-three/drei";

function TorusKnot({ position, color, scale = 1 }) {
  const ref = useRef();
  useFrame((s) => {
    ref.current.rotation.x = s.clock.elapsedTime * 0.3;
    ref.current.rotation.y = s.clock.elapsedTime * 0.5;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>
      <mesh ref={ref} position={position} scale={scale}>
        <torusKnotGeometry args={[0.5, 0.18, 100, 16]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} emissive={color} emissiveIntensity={0.15} />
      </mesh>
    </Float>
  );
}

function Icosahedron({ position, color, scale = 1 }) {
  const ref = useRef();
  useFrame((s) => {
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.4) * 0.5;
    ref.current.rotation.y += 0.01;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={1.2}>
      <mesh ref={mesh} position={position} scale={scale}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} wireframe />
      </mesh>
    </Float>
  );
}

function Ring({ position, color }) {
  const ref = useRef();
  useFrame((s) => {
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.2) * 0.3;
    ref.current.rotation.z = s.clock.elapsedTime * 0.2;
  });
  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={1}>
      <mesh ref={ref} position={position}>
        <torusGeometry args={[0.7, 0.03, 16, 60]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.1} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </Float>
  );
}

function CubeCluster({ position }) {
  const ref = useRef();
  useFrame((s) => {
    ref.current.rotation.y = s.clock.elapsedTime * 0.15;
  });
  return (
    <group ref={ref} position={position}>
      {[-0.5, 0, 0.5].map((x, i) => (
        <Float key={i} speed={1 + i * 0.3} rotationIntensity={0.4} floatIntensity={1.5}>
          <mesh position={[x, 0, 0]}>
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshStandardMaterial
              color={["#4B7BEC", "#8B5CF6", "#EC4899"][i]}
              metalness={0.9}
              roughness={0.1}
              emissive={["#4B7BEC", "#8B5CF6", "#EC4899"][i]}
              emissiveIntensity={0.1}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Scene() {
  const group = useRef();
  useFrame((state) => {
    const { x, y } = state.pointer;
    group.current.rotation.y += (x * 0.3 - group.current.rotation.y) * 0.03;
    group.current.rotation.x += (-y * 0.2 - group.current.rotation.x) * 0.03;
  });

  return (
    <group ref={group}>
      <TorusKnot position={[-2.8, 1.2, -1]} color="#4B7BEC" scale={0.9} />
      <TorusKnot position={[2.6, -1.5, -0.5]} color="#EC4899" scale={0.7} />
      <Icosahedron position={[3, 1.8, -2]} color="#8B5CF6" scale={1.1} />
      <Icosahedron position={[-3.2, -1.2, -1.5]} color="#4B7BEC" scale={0.8} />
      <Ring position={[0, 2.5, -3]} color="#60A5FA" />
      <Ring position={[0, -2.2, -2.5]} color="#A78BFA" />
      <CubeCluster position={[0, 0, 0.5]} />
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 4]} intensity={2} color="#4B7BEC" />
      <directionalLight position={[-6, -2, 3]} intensity={0.8} color="#EC4899" />
      <spotLight position={[0, 5, 7]} intensity={1.2} angle={0.5} penumbra={1} color="#8B5CF6" />
      <Suspense fallback={null}>
        <Scene />
        <Sparkles count={120} scale={14} size={2.5} speed={0.3} color="#60A5FA" opacity={0.6} />
        <Stars radius={50} depth={40} count={1200} factor={4} saturation={0} fade speed={0.8} />
        <ContactShadows position={[0, -3.5, 0]} opacity={0.3} scale={20} blur={4} far={6} color="#000" />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}
