import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";

function Gem() {
  const mesh = useRef();
  useFrame((state) => {
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    mesh.current.rotation.y += 0.012;
    mesh.current.scale.setScalar(0.6 + Math.sin(state.clock.elapsedTime * 1.2) * 0.03);
  });
  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.5}>
      <mesh ref={mesh} scale={0.6}>
        <octahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          backside
          thickness={0.6}
          roughness={0.02}
          metalness={0.95}
          ior={2.5}
          chromaticAberration={0.1}
          color="#3B82F6"
          emissive="#2563EB"
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
}

function Fallback() {
  return <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 animate-pulse" />;
}

export const NavbarLogo3D = () => (
  <Suspense fallback={<Fallback />}>
    <Canvas
      camera={{ position: [0, 0, 4], fov: 40 }}
      dpr={[1, 1.2]}
      gl={{ antialias: false, alpha: true }}
      style={{ width: 42, height: 42 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 3]} intensity={1.5} color="#60A5FA" />
      <pointLight position={[-2, 1, 2]} intensity={1.2} color="#3B82F6" />
      <Sparkles count={12} scale={2} size={2} speed={0.4} color="#60A5FA" />
      <Gem />
    </Canvas>
  </Suspense>
);
