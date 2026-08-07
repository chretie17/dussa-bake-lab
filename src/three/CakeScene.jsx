import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer, PresentationControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * The cake on the home page, built in three.js rather than drawn.
 *
 * Everything is generated from primitives — no model files to download — so it
 * stays sharp at any size and can be re-coloured to match either theme. Drag to
 * turn it; left alone it drifts on its own.
 */

const SPONGE = '#4E2E1B'
const SPONGE_DARK = '#33190D'
const GANACHE = '#3B2010'
const GANACHE_LIGHT = '#5C3520'
const CREAM = '#F6E7D0'
const PLATE = '#FFFBF4'
const CHERRY = '#B8322C'

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

/** A drip of ganache running down the side: a capsule tucked against the rim. */
function Drip({ angle, radius, length, width }) {
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  return (
    <mesh position={[x, 0.92 - length / 2, z]} castShadow>
      <capsuleGeometry args={[width, length, 4, 12]} />
      <meshStandardMaterial color={GANACHE} roughness={0.34} metalness={0.02} />
    </mesh>
  )
}

/** A piped rosette: a squashed torus knot reads surprisingly well as buttercream. */
function Rosette({ position, scale = 1, color = GANACHE_LIGHT }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.085, 16, 40]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.085, 0.062, 14, 32]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.055, 20, 16]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
    </group>
  )
}

function Cherry({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.13, 28, 24]} />
        <meshStandardMaterial color={CHERRY} roughness={0.18} metalness={0.05} />
      </mesh>
      <mesh position={[0.05, 0.16, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 8]} />
        <meshStandardMaterial color="#5E3A21" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Shards of chocolate stuck into the top. */
function Shard({ position, rotation }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={[0.22, 0.26, 0.035]} />
      <meshStandardMaterial color="#2A1710" roughness={0.28} metalness={0.06} />
    </mesh>
  )
}

function Cake({ bright }) {
  const group = useRef()

  const drips = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        angle: (i / 16) * Math.PI * 2,
        length: 0.24 + ((i * 37) % 11) / 18,
        width: 0.05 + ((i * 53) % 7) / 150,
      })),
    [],
  )

  const rosettes = useMemo(() => {
    const ring = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      return [Math.cos(a) * 0.94, 1.0, Math.sin(a) * 0.94]
    })
    return [...ring, [0, 1.02, 0]]
  }, [])

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.13
  })

  return (
    <group ref={group} position={[0, -0.35, 0]}>
      {/* stand */}
      <mesh position={[0, -0.92, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.55, 1.55, 0.07, 64]} />
        <meshStandardMaterial color={PLATE} roughness={0.25} metalness={0.06} />
      </mesh>
      <mesh position={[0, -1.16, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.42, 32]} />
        <meshStandardMaterial color={PLATE} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.62, 0.68, 0.08, 48]} />
        <meshStandardMaterial color={PLATE} roughness={0.3} />
      </mesh>

      {/* sponge body, with the cream layers showing through */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.22, 1.8, 72]} />
        <meshStandardMaterial color={SPONGE} roughness={0.86} />
      </mesh>
      {[-0.5, 0.1].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[1.215, 1.225, 0.13, 72]} />
          <meshStandardMaterial color={CREAM} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[1.22, 1.24, 0.12, 72]} />
        <meshStandardMaterial color={SPONGE_DARK} roughness={0.9} />
      </mesh>

      {/* ganache collar and the drips hanging off it */}
      <mesh position={[0, 0.86, 0]} castShadow>
        <cylinderGeometry args={[1.24, 1.24, 0.2, 72]} />
        <meshStandardMaterial color={GANACHE} roughness={0.3} metalness={0.03} />
      </mesh>
      {drips.map((d, i) => (
        <Drip key={i} angle={d.angle} radius={1.21} length={d.length} width={d.width} />
      ))}

      {/* glossy top */}
      <mesh position={[0, 0.95, 0]} receiveShadow>
        <cylinderGeometry args={[1.24, 1.24, 0.02, 72]} />
        <meshStandardMaterial
          color={GANACHE_LIGHT}
          roughness={0.16}
          metalness={0.08}
          envMapIntensity={bright ? 1.1 : 0.8}
        />
      </mesh>

      {rosettes.map((p, i) => (
        <Rosette key={i} position={p} scale={i === rosettes.length - 1 ? 1.15 : 1} />
      ))}

      <Shard position={[0.42, 1.16, 0.3]} rotation={[0.2, 0.6, 0.35]} />
      <Shard position={[-0.36, 1.14, -0.24]} rotation={[-0.15, -0.4, -0.28]} />
      <Shard position={[0.05, 1.18, -0.48]} rotation={[0.1, 1.2, 0.2]} />
      <Cherry position={[0, 1.24, 0]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export default function CakeScene({ bright = true }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.75, 6.6], fov: 32 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ touchAction: 'pan-y', background: 'transparent' }}
    >
      <ambientLight intensity={bright ? 0.85 : 0.45} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={bright ? 2.4 : 2.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-5, 3, -2]} intensity={bright ? 0.7 : 0.5} color="#FFD9A8" />
      <pointLight position={[0, 3.4, 1.6]} intensity={bright ? 12 : 18} color="#FFE2BB" distance={9} />

      {/* Drag to turn it, then it springs back and carries on drifting. */}
      <PresentationControls
        global
        snap
        speed={1.1}
        zoom={1}
        rotation={[0.08, -0.35, 0]}
        polar={[-0.15, 0.35]}
        azimuth={[-0.7, 0.7]}
        config={{ mass: 1.4, tension: 220 }}
      >
        <Float rotationIntensity={0.18} floatIntensity={0.5} speed={1.4}>
          <Cake bright={bright} />
        </Float>
      </PresentationControls>

      <ContactShadows
        position={[0, -1.82, 0]}
        opacity={bright ? 0.38 : 0.55}
        scale={9}
        blur={2.6}
        far={4}
        resolution={512}
        color="#2A1810"
      />

      {/* Reflections come from shapes we place ourselves rather than a
          downloaded HDRI, so the scene works offline and adds no requests. */}
      <Environment resolution={256} environmentIntensity={bright ? 0.75 : 0.5}>
        <Lightformer form="rect" intensity={bright ? 3 : 2.2} position={[0, 5, -2]} scale={[10, 6, 1]} color="#FFF3E2" />
        <Lightformer form="circle" intensity={bright ? 2.2 : 1.6} position={[-4, 2, 3]} scale={5} color="#FFD9A8" />
        <Lightformer form="circle" intensity={1.2} position={[4, 1, 3]} scale={4} color="#F6E7D0" />
        <Lightformer form="rect" intensity={0.8} position={[0, -3, 2]} scale={[8, 4, 1]} color="#E8C9A0" />
      </Environment>
    </Canvas>
  )
}
