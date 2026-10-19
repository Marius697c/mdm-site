"use client";

import { Component, Suspense, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { HOTSPOTS } from "@/lib/hotspots";
import { GlbMachine, StylizedMachine } from "./MachineModel";

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Props = {
  useGlb: boolean;
  /** Boutons des hotspots (DOM), repositionnés à chaque image selon la caméra. */
  markers: MutableRefObject<(HTMLButtonElement | null)[]>;
};

const point = new Vector3();

/** Projette chaque hotspot 3D à l'écran et déplace le bouton correspondant. */
function MarkerTracker({ markers }: Pick<Props, "markers">) {
  useFrame(({ camera, size }) => {
    HOTSPOTS.forEach((h, i) => {
      const el = markers.current[i];
      if (!el) return;
      point.set(h.position[0], h.position[1], h.position[2]).project(camera);
      const x = (point.x * 0.5 + 0.5) * size.width;
      const y = (-point.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      el.style.visibility = point.z < 1 ? "visible" : "hidden";
    });
  });
  return null;
}

export default function MachineScene({ useGlb, markers }: Props) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [11, 8, 13], fov: 38 }} aria-hidden="true">
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 10, 8]} intensity={1.6} />
      <directionalLight position={[-8, 4, -6]} intensity={0.5} color="#7be4f2" />

      <Suspense fallback={null}>
        {useGlb ? (
          <Boundary fallback={<StylizedMachine />}>
            <GlbMachine />
          </Boundary>
        ) : (
          <StylizedMachine />
        )}
        <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={20} blur={2.5} far={6} />
      </Suspense>

      <MarkerTracker markers={markers} />
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 2, 0]}
        enableDamping
      />
    </Canvas>
  );
}
