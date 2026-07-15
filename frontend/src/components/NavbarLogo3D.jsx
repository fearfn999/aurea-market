import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";

function Gem() {
  const mesh = useRef();
  useFrame((state) => {
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    mesh.current.rotation.y += 0.008;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
      <mesh ref={mesh} scale={0.6}>
        <octahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          backside
          thickness={0.8}
          roughness={0.05}
          metalness={0.9}
          ior={2.2}
          chromaticAberration={0.06}
          color="#DBA520"
          emissive="#DBA520"
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

function Fallback() {
  return <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber to-hot" />;
}

export const NavbarLogo3D = () => (
  <Suspense fallback={<Fallback />}>
    <Canvas
      camera={{ position: [0, 0, 4], fov: 40 }}
      dpr={[1, 1.2]}
      gl={{ antialias: false, alpha: true }}
      style={{ width: 36, height: 36 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2, 3]} intensity={1.5} />
      <pointLight position={[-2, 1, 2]} intensity={0.8} color="#DBA520" />
      <Gem />
    </Canvas>
  </Suspense>
);
