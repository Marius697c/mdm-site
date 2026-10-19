"use client";

import { useLayoutEffect, useMemo } from "react";
import { Box3, Vector3 } from "three";
import { RoundedBox, useGLTF } from "@react-three/drei";

export const MODEL_URL = "/models/mdm.glb";

const NAVY = "#122e5f";
const PLATE = "#e8f0fb";
const DARK = "#050f26";

/** Machine stylisée : 100 cm (x) × 40 cm (y) × 60 cm (z), à l'échelle 1 unité = 10 cm. */
export function StylizedMachine() {
  return (
    <group>
      <RoundedBox args={[10, 4, 6]} radius={0.22} smoothness={4} position={[0, 2, 0]}>
        <meshStandardMaterial color={NAVY} metalness={0.25} roughness={0.5} />
      </RoundedBox>
      {/* plan de dessus */}
      <mesh position={[0, 4.005, 0]}>
        <boxGeometry args={[9.5, 0.03, 5.5]} />
        <meshStandardMaterial color={PLATE} roughness={0.6} />
      </mesh>
      {/* liseré cyan en façade */}
      <mesh position={[0, 1.2, 3.005]}>
        <boxGeometry args={[6, 0.08, 0.02]} />
        <meshStandardMaterial color="#3fd0e6" emissive="#3fd0e6" emissiveIntensity={0.8} />
      </mesh>

      {/* écran tactile incliné */}
      <group position={[-3, 4.3, 0.1]} rotation={[0.3, 0, 0]}>
        <mesh>
          <boxGeometry args={[3.4, 0.14, 2.6]} />
          <meshStandardMaterial color={DARK} metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <boxGeometry args={[3.05, 0.01, 2.25]} />
          <meshStandardMaterial color="#14b8d4" emissive="#14b8d4" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* emplacement SPINCHIP */}
      <mesh position={[0.2, 4.04, 0]}>
        <boxGeometry args={[1.5, 0.05, 0.55]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      {/* emplacement tests salivaires / nasaux */}
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} position={[2, 4.04, z * 0.6]}>
          <boxGeometry args={[1.2, 0.05, 0.4]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      ))}
      {/* emplacement solutions préparées */}
      {[-1.1, 0, 1.1].map((z) => (
        <mesh key={z} position={[3.8, 4.04, z]}>
          <cylinderGeometry args={[0.38, 0.38, 0.05, 32]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      ))}
    </group>
  );
}

/** Modèle fourni par l'utilisateur, recadré à 10 unités de long et posé sur le sol. */
export function GlbMachine() {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    model.scale.setScalar(1);
    model.position.set(0, 0, 0);
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const scale = size.x > 0 ? 10 / size.x : 1;
    model.scale.setScalar(scale);
    const fitted = new Box3().setFromObject(model);
    const center = fitted.getCenter(new Vector3());
    model.position.set(-center.x, -fitted.min.y, -center.z);
  }, [model]);

  return <primitive object={model} />;
}
