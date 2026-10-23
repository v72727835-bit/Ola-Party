import React, { useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center } from '@react-three/drei/core/Center';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Procedural geometry only. Demand rendering stops GPU work while idle.
export default function GameLobbyScene() {
  const [angle, setAngle] = useState(.15);
  const geometry = useMemo(() => new RoundedBoxGeometry(1.25, 1.25, 1.25, 2, .15), []);
  const drag = useRef<number | null>(null);
  const [lost, setLost] = useState(false);
  if (lost) throw new Error('WebGL context lost');
  return <div role="group" aria-label="Interactive dice preview. Drag to rotate; use Back to artwork to close." onPointerDown={event => { if ((event.target as HTMLElement).tagName === 'CANVAS') { drag.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={event => { if (drag.current !== null) { const delta = event.clientX - drag.current; drag.current = event.clientX; setAngle(a => a + delta * .012); } }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} style={{ width: '100%', height: 190, position: 'relative', touchAction: 'pan-y' }}>
    <Canvas frameloop="demand" dpr={[1, 1.25]} camera={{ position: [3, 2.5, 4], fov: 37 }} gl={{ antialias: false, powerPreference: 'low-power', alpha: true }} onCreated={({ gl }) => {
      gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); setLost(true); }, { once: true });
    }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 6, 4]} intensity={3} color="#e2d5ff" />
      <Center><group rotation={[.2, angle, -.2]}>
        <mesh geometry={geometry}><meshStandardMaterial color="#efe6d4" roughness={.4} /></mesh>
        {[[-.3, .3], [.3, .3], [0, 0], [-.3, -.3], [.3, -.3]].map(([x, y], i) => <mesh key={i} position={[x, y, .631]}><circleGeometry args={[.075, 16]} /><meshBasicMaterial color="#272036" /></mesh>)}
      </group></Center>
      <mesh position={[1, -.4, -.5]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.15, .018, 6, 48]} /><meshStandardMaterial color="#8b6abc" /></mesh>
    </Canvas>
    <div style={{ position: 'absolute', right: 6, bottom: 6, display: 'flex', gap: 8 }}>
      <button aria-label="Rotate dice left" onClick={() => setAngle(a => a - .4)} style={control}>↶</button>
      <button aria-label="Rotate dice right" onClick={() => setAngle(a => a + .4)} style={control}>↷</button>
    </div>
  </div>;
}
const control = { background: '#322646', color: '#ede6ff', border: '1px solid #a78bfa66', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' };
