"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Box3, type Group, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useGLTF } from "@react-three/drei";

export const MODEL_URL = "/models/mdm.glb";

const NAVY = "#122e5f";
const NAVY_DEEP = "#081a3b";
const PEARL = "#eef3fb";
const PLATE = "#d9e4f5";
const DARK = "#050f26";
const CYAN = "#3fd0e6";
const CYAN_DEEP = "#14b8d4";
const STEEL = "#9fb3d1";

/** Matériau lumineux (LED, écran, liserés). */
function Glow({ color = CYAN, intensity = 1.2 }: { color?: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />;
}

/** Bac encastré dans le plan de dessus : cuvette sombre + cadre métallique. */
function Bay({ size, position, glow = CYAN }: { size: [number, number]; position: [number, number]; glow?: string }) {
  const [w, d] = size;
  const [x, z] = position;
  return (
    <group position={[x, 4.0, z]}>
      <RoundedBox args={[w + 0.16, 0.04, d + 0.16]} radius={0.02} smoothness={2} position={[0, 0.01, 0]}>
        <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[w, 0.02, d]} />
        <meshStandardMaterial color={DARK} roughness={0.8} />
      </mesh>
      {/* liseré lumineux d'état autour du bac */}
      <mesh position={[0, 0.036, d / 2 + 0.05]}>
        <boxGeometry args={[w * 0.6, 0.012, 0.03]} />
        <Glow color={glow} />
      </mesh>
    </group>
  );
}

/** Écran tactile incliné avec une interface schématique. */
function TouchScreen() {
  return (
    <group position={[-3.1, 4.0, -0.2]}>
      {/* pied / charnière */}
      <mesh position={[0, 0.18, -0.6]}>
        <boxGeometry args={[2.2, 0.36, 0.5]} />
        <meshStandardMaterial color={NAVY_DEEP} metalness={0.5} roughness={0.35} />
      </mesh>
      <group position={[0, 0.45, 0.05]} rotation={[-0.55, 0, 0]}>
        <RoundedBox args={[3.5, 2.5, 0.14]} radius={0.06} smoothness={3}>
          <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.25} />
        </RoundedBox>
        <group position={[0, 0, 0.075]}>
          {/* dalle */}
          <mesh>
            <planeGeometry args={[3.2, 2.2]} />
            <meshStandardMaterial color="#0a2a55" emissive="#0b3a73" emissiveIntensity={0.9} />
          </mesh>
          {/* barre de titre */}
          <mesh position={[0, 0.92, 0.002]}>
            <planeGeometry args={[3.2, 0.3]} />
            <Glow color={CYAN_DEEP} intensity={0.9} />
          </mesh>
          {/* anneau de progression */}
          <mesh position={[-0.9, 0.05, 0.003]}>
            <ringGeometry args={[0.38, 0.5, 48, 1, 0, Math.PI * 1.5]} />
            <Glow color={CYAN} />
          </mesh>
          <mesh position={[-0.9, 0.05, 0.002]}>
            <ringGeometry args={[0.38, 0.5, 48]} />
            <meshStandardMaterial color="#1c3d78" />
          </mesh>
          {/* lignes de résultats */}
          {[0.4, 0.1, -0.2, -0.5].map((y, i) => (
            <mesh key={y} position={[0.55 - (i % 2) * 0.15, y, 0.003]}>
              <planeGeometry args={[1.3 - (i % 2) * 0.3, 0.1]} />
              <meshStandardMaterial color={i === 0 ? "#7be4f2" : "#4a73b3"} emissive={i === 0 ? "#7be4f2" : "#4a73b3"} emissiveIntensity={0.6} />
            </mesh>
          ))}
          {/* bouton principal */}
          <mesh position={[0.9, -0.82, 0.003]}>
            <planeGeometry args={[1.0, 0.3]} />
            <Glow color={CYAN} intensity={1} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Emplacement test sanguin : cartouche SPINCHIP circulaire qui tourne (microfluidique centrifuge). */
function SpinchipBay() {
  const disc = useRef<Group>(null);
  useFrame((_, delta) => {
    if (disc.current) disc.current.rotation.y += delta * 1.2;
  });
  return (
    <group>
      <Bay size={[1.9, 1.9]} position={[-0.2, 0]} />
      <group position={[-0.2, 4.06, 0]}>
        {/* plateau de centrifugation */}
        <mesh>
          <cylinderGeometry args={[0.82, 0.82, 0.04, 64]} />
          <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.2} />
        </mesh>
        <group ref={disc} position={[0, 0.05, 0]}>
          {/* cartouche translucide */}
          <mesh>
            <cylinderGeometry args={[0.72, 0.72, 0.06, 64]} />
            <meshPhysicalMaterial color="#cfefff" transmission={0.6} roughness={0.15} thickness={0.2} transparent opacity={0.75} />
          </mesh>
          {/* chambres microfluidiques */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.5, 0.04, Math.sin(a) * 0.5]}>
                <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
                <Glow color={i % 2 ? "#e2435b" : CYAN} intensity={0.8} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 24]} />
            <meshStandardMaterial color={NAVY} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Emplacement tests nasaux : portoir d'écouvillons / cartouches PCR. */
function NasalBay() {
  const cols = [-0.35, 0, 0.35];
  const rows = [-0.25, 0.25];
  return (
    <group>
      <Bay size={[1.5, 1.3]} position={[1.85, 1.15]} />
      {cols.flatMap((x) =>
        rows.map((z) => (
          <group key={`${x}-${z}`} position={[1.85 + x, 4.0, 1.15 + z]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.55, 20]} />
              <meshPhysicalMaterial color="#f4f8ff" roughness={0.2} transmission={0.4} transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, 0.62, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.1, 20]} />
              <meshStandardMaterial color={CYAN_DEEP} roughness={0.4} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/** Emplacement tests salivaires : trappe fermée (extension future). */
function SalivaBay() {
  return (
    <group>
      <Bay size={[1.5, 1.4]} position={[1.85, -1.3]} glow="#f2b84b" />
      <group position={[1.85, 4.06, -1.3]}>
        <RoundedBox args={[1.3, 0.06, 1.2]} radius={0.03} smoothness={2}>
          <meshStandardMaterial color={PLATE} roughness={0.5} />
        </RoundedBox>
        {/* godet de recueil */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.3, 0.26, 0.08, 40]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <ringGeometry args={[0.18, 0.24, 40]} />
          <meshStandardMaterial color={DARK} side={2} />
        </mesh>
      </group>
    </group>
  );
}

/** Emplacement solutions pour détecter les bactéries : portoir de flacons (PCR temps réel). */
function SolutionsBay() {
  const liquids = ["#3fd0e6", "#7be4f2", "#f2b84b", "#e2435b"];
  return (
    <group>
      <Bay size={[1.6, 4.4]} position={[3.85, 0]} />
      {[-0.35, 0.35].flatMap((x) =>
        [-1.65, -0.55, 0.55, 1.65].map((z, j) => (
          <group key={`${x}-${z}`} position={[3.85 + x, 4.0, z]}>
            {/* puits chauffant */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.03, 32]} />
              <Glow color={CYAN} intensity={0.35} />
            </mesh>
            {/* flacon */}
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.55, 28]} />
              <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={0.85} thickness={0.1} transparent opacity={0.45} />
            </mesh>
            {/* liquide */}
            <mesh position={[0, 0.24, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.36, 28]} />
              <meshStandardMaterial color={liquids[j]} emissive={liquids[j]} emissiveIntensity={0.35} transparent opacity={0.9} />
            </mesh>
            {/* bouchon */}
            <mesh position={[0, 0.64, 0]}>
              <cylinderGeometry args={[0.19, 0.19, 0.12, 28]} />
              <meshStandardMaterial color={NAVY} roughness={0.4} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/** Façade : bandeau d'état, LED, tiroir à consommables, grilles d'aération. */
function Details() {
  return (
    <group>
      {/* bandeau lumineux de façade */}
      <mesh position={[-1.2, 2.9, 3.005]}>
        <boxGeometry args={[6.4, 0.06, 0.02]} />
        <Glow />
      </mesh>
      {/* afficheur d'état */}
      <RoundedBox args={[1.6, 0.55, 0.05]} radius={0.04} smoothness={2} position={[3.2, 2.75, 3.0]}>
        <meshStandardMaterial color={DARK} metalness={0.4} roughness={0.2} />
      </RoundedBox>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[2.75 + i * 0.45, 2.75, 3.03]}>
          <circleGeometry args={[0.08, 20]} />
          <Glow color={i === 2 ? "#f2b84b" : CYAN} intensity={1.4} />
        </mesh>
      ))}
      {/* tiroir à consommables */}
      <RoundedBox args={[5.2, 1.4, 0.06]} radius={0.05} smoothness={2} position={[-1.6, 1.35, 3.0]}>
        <meshStandardMaterial color="#1c3d78" metalness={0.3} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[2.0, 0.12, 0.12]} radius={0.05} smoothness={2} position={[-1.6, 1.85, 3.08]}>
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
      </RoundedBox>
      {/* trappe de maintenance */}
      <RoundedBox args={[2.0, 1.4, 0.05]} radius={0.05} smoothness={2} position={[3.2, 1.35, 3.0]}>
        <meshStandardMaterial color="#1c3d78" metalness={0.3} roughness={0.45} />
      </RoundedBox>
      {/* grilles d'aération latérales */}
      {[-5.005, 5.005].map((x) =>
        Array.from({ length: 7 }, (_, i) => (
          <mesh key={`${x}-${i}`} position={[x, 1.2 + i * 0.28, 0]}>
            <boxGeometry args={[0.02, 0.09, 3.6]} />
            <meshStandardMaterial color={DARK} />
          </mesh>
        )),
      )}
      {/* pieds */}
      {[-4.4, 4.4].flatMap((x) =>
        [-2.5, 2.5].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.06, z]}>
            <cylinderGeometry args={[0.28, 0.32, 0.12, 24]} />
            <meshStandardMaterial color={DARK} roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

/**
 * Machine stylisée détaillée : 100 cm (x) × 40 cm (y) × 60 cm (z), à l'échelle 1 unité = 10 cm.
 * Corps bleu marine, capot nacré, liseré lumineux, et un bac par compartiment.
 */
export function StylizedMachine() {
  return (
    <group>
      {/* socle en retrait */}
      <RoundedBox args={[9.7, 0.3, 5.7]} radius={0.1} smoothness={3} position={[0, 0.27, 0]}>
        <meshStandardMaterial color={DARK} metalness={0.3} roughness={0.6} />
      </RoundedBox>
      {/* corps */}
      <RoundedBox args={[10, 3.2, 6]} radius={0.22} smoothness={4} position={[0, 2.0, 0]}>
        <meshStandardMaterial color={NAVY} metalness={0.35} roughness={0.42} />
      </RoundedBox>
      {/* jonction lumineuse corps / capot */}
      <mesh position={[0, 3.62, 0]}>
        <boxGeometry args={[9.9, 0.05, 5.9]} />
        <Glow intensity={0.9} />
      </mesh>
      {/* capot nacré */}
      <RoundedBox args={[10, 0.38, 6]} radius={0.15} smoothness={4} position={[0, 3.82, 0]}>
        <meshStandardMaterial color={PEARL} metalness={0.15} roughness={0.35} />
      </RoundedBox>

      <Details />
      <TouchScreen />
      <SpinchipBay />
      <NasalBay />
      <SalivaBay />
      <SolutionsBay />
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
