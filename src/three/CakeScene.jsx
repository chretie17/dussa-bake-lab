import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer, PresentationControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * The cake on the home page, built in three.js rather than drawn.
 *
 * Everything is generated from primitives — no model files to download — so it
 * stays sharp at any size and works offline. Drag to turn it; left alone it
 * drifts on its own.
 *
 * Two things are deliberate. The whole model is scaled to fit whatever box it
 * lands in (see Fit), because a fixed camera crops the stand on short screens.
 * And it runs at two quality levels, so a phone gets the same cake with fewer
 * polygons rather than a flat drawing instead.
 */

/* Two-tone on purpose: an all-chocolate cake reads as a brown barrel at this
   size. Cream buttercream under dark ganache is the shape people recognise. */
const BUTTERCREAM = '#F6E7CE'
const GANACHE = '#3B1E0F'
const SPONGE = '#4A2A18'
const CHERRY = '#C22F2B'
const PORCELAIN = '#FFFCF6'
const GOLD = '#D9A441'

/* ------------------------------------------------------------------ */
/* Geometry                                                             */
/* ------------------------------------------------------------------ */

/**
 * A cylinder carrying the vertical ridges a palette knife leaves behind.
 * This one detail is what separates buttercream from a plastic tube.
 */
function ridgedCylinder(rTop, rBottom, height, segments, ridges, depth) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, height, segments, 1, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i)
    const r = Math.hypot(v.x, v.z)
    if (r < 1e-4) continue
    const angle = Math.atan2(v.z, v.x)
    const swell = 1 + (Math.sin(angle * ridges) * 0.5 + 0.5) * depth
    pos.setX(i, v.x * swell)
    pos.setZ(i, v.z * swell)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/**
 * One drip, modelled once and reused at different scales.
 *
 * The profile is the whole point: wide where it leaves the collar, pinched in
 * the middle, swelling again just before it rounds off. A capsule — which is
 * what this was — gives an even sausage, and twenty even sausages read as a
 * picket fence rather than ganache.
 */
function dripGeometry(segments) {
  const profile = [
    [0, -1],
    [0.026, -0.972],
    [0.044, -0.92],
    [0.052, -0.85],
    [0.05, -0.72],
    [0.046, -0.52],
    [0.048, -0.33],
    [0.055, -0.15],
    [0.064, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(profile, segments)
}

/** A piped rosette — a real one is a spiral, so sweep a tube along one. */
function rosette(turns, radius, rise, thickness, segments) {
  const points = []
  const steps = segments
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const angle = t * Math.PI * 2 * turns
    const r = radius * (1 - t * 0.88)
    points.push(new THREE.Vector3(Math.cos(angle) * r, t * rise, Math.sin(angle) * r))
  }
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.TubeGeometry(curve, steps, thickness, Math.max(6, segments / 8), false)
}

/** The turned stem of the cake stand. */
function stemProfile() {
  return [
    [0.3, 0],
    [0.22, 0.05],
    [0.17, 0.13],
    [0.145, 0.24],
    [0.15, 0.35],
    [0.19, 0.45],
    [0.27, 0.51],
  ].map(([x, y]) => new THREE.Vector2(x, y))
}

/* ------------------------------------------------------------------ */
/* Parts                                                                */
/* ------------------------------------------------------------------ */

/**
 * A drip of ganache, squashed against the side: narrower going out from the
 * cake than it is across, which is how a real one sits.
 */
function Drip({ angle, radius, length, width, geometry, material }) {
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
      rotation={[0, -angle, 0]}
      scale={[width * 0.78, length, width * 1.3]}
      castShadow
    />
  )
}

function Cherry({ position, scale = 1, segments }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.115, segments, segments / 2]} />
        <meshPhysicalMaterial
          color={CHERRY}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>
      <mesh position={[0.03, 0.15, 0]} rotation={[0, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.011, 0.014, 0.24, 6]} />
        <meshStandardMaterial color="#4C3018" roughness={0.85} />
      </mesh>
    </group>
  )
}

/** A shard of tempered chocolate standing in the frosting. */
function Shard({ position, rotation, scale, material }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <boxGeometry args={[0.17, 0.27, 0.02]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function CakeModel({ high }) {
  const spin = useRef()

  const seg = high ? 128 : 64
  const small = high ? 20 : 10
  const dripCount = high ? 28 : 18
  const rosetteCount = 9

  /* Materials are shared rather than made per mesh — one ganache, used by
     every drip and shard, is dozens of fewer programs to compile. */
  const materials = useMemo(() => {
    const ganache = new THREE.MeshPhysicalMaterial({
      color: GANACHE,
      roughness: 0.24,
      metalness: 0.02,
      clearcoat: high ? 0.85 : 0,
      clearcoatRoughness: 0.18,
    })
    const chocolate = new THREE.MeshPhysicalMaterial({
      color: '#2C160B',
      roughness: 0.2,
      metalness: 0.04,
      clearcoat: high ? 0.7 : 0,
      clearcoatRoughness: 0.22,
    })
    return { ganache, chocolate }
  }, [high])

  const geometries = useMemo(
    () => ({
      body: ridgedCylinder(1.16, 1.13, 1.55, seg, 54, 0.026),
      collar: ridgedCylinder(1.2, 1.19, 0.15, seg, 54, 0.014),
      drip: dripGeometry(high ? 16 : 12),
      rosette: rosette(2.5, 0.2, 0.2, 0.05, high ? 96 : 56),
      stem: new THREE.LatheGeometry(stemProfile(), high ? 48 : 24),
    }),
    [seg, high],
  )

  const drips = useMemo(
    () =>
      Array.from({ length: dripCount }, (_, i) => ({
        // Deterministic but uneven — evenly spaced, evenly sized drips look
        // printed on. The angle is nudged off the grid as well as the size.
        angle: ((i + (((i * 41) % 9) - 4) / 22) / dripCount) * Math.PI * 2,
        length: 0.15 + ((i * 37) % 17) / 32,
        width: 0.78 + ((i * 53) % 11) / 22,
      })),
    [dripCount],
  )

  const rosettes = useMemo(
    () =>
      Array.from({ length: rosetteCount }, (_, i) => {
        const a = (i / rosetteCount) * Math.PI * 2
        return { position: [Math.cos(a) * 0.86, 0.54, Math.sin(a) * 0.86], rotation: a }
      }),
    [],
  )

  const flecks = useMemo(
    () =>
      Array.from({ length: high ? 16 : 8 }, (_, i) => {
        const a = (i * 2.39996) % (Math.PI * 2)
        const r = 0.25 + ((i * 29) % 60) / 90
        return [Math.cos(a) * r, 0.6 + ((i * 17) % 5) / 60, Math.sin(a) * r]
      }),
    [high],
  )

  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.12
  })

  return (
    /* Modelled around the origin, then lifted so the whole thing is centred
       on y=0 — Fit below assumes that. */
    <group position={[0, 0.35, 0]}>
      <group ref={spin}>
        {/* ------------------------------------------------ cake stand */}
        <mesh position={[0, -1.71, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.66, 0.7, 0.075, high ? 64 : 32]} />
          <meshPhysicalMaterial color={PORCELAIN} roughness={0.14} clearcoat={high ? 0.6 : 0} />
        </mesh>
        <mesh geometry={geometries.stem} position={[0, -1.67, 0]} castShadow>
          <meshPhysicalMaterial color={PORCELAIN} roughness={0.16} clearcoat={high ? 0.6 : 0} />
        </mesh>
        <mesh position={[0, -1.12, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.48, 1.42, 0.055, high ? 96 : 44]} />
          <meshPhysicalMaterial color={PORCELAIN} roughness={0.13} clearcoat={high ? 0.7 : 0} />
        </mesh>
        <mesh position={[0, -1.09, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[1.48, 0.028, 8, high ? 96 : 44]} />
          <meshPhysicalMaterial color={PORCELAIN} roughness={0.13} clearcoat={high ? 0.7 : 0} />
        </mesh>

        {/* -------------------------------------------- buttercream body */}
        <mesh geometry={geometries.body} position={[0, -0.285, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={BUTTERCREAM} roughness={0.62} />
        </mesh>

        {/* A band of exposed sponge at the base: semi-naked, the way these are
            actually finished, and it stops the side reading as one slab. It
            has to clear the ridges above, or the buttercream pokes through it
            as a row of dark triangles. */}
        <mesh position={[0, -0.985, 0]} castShadow>
          <cylinderGeometry args={[1.172, 1.162, 0.16, seg]} />
          <meshStandardMaterial color={SPONGE} roughness={0.94} />
        </mesh>

        {/* ------------------------------------------ ganache and drips */}
        <mesh geometry={geometries.collar} position={[0, 0.415, 0]} castShadow>
          <primitive object={materials.ganache} attach="material" />
        </mesh>
        {/* A plain disc, deliberately. A domed lathe looks better on paper but
            its triangles all converge on one point at the centre, and that
            pole threw a white starburst across the top. */}
        <mesh position={[0, 0.5, 0]} receiveShadow>
          <cylinderGeometry args={[1.206, 1.2, 0.06, seg]} />
          <primitive object={materials.ganache} attach="material" />
        </mesh>

        {/* Started inside the collar so there is no seam where they meet. */}
        <group position={[0, 0.42, 0]}>
          {drips.map((d, i) => (
            <Drip
              key={i}
              angle={d.angle}
              radius={1.175}
              length={d.length}
              width={d.width}
              geometry={geometries.drip}
              material={materials.ganache}
            />
          ))}
        </group>

        {/* ----------------------------------------------- piped top */}
        {rosettes.map((r, i) => (
          <mesh
            key={i}
            geometry={geometries.rosette}
            position={r.position}
            rotation={[0, r.rotation, 0]}
            castShadow
          >
            <meshStandardMaterial color={BUTTERCREAM} roughness={0.55} />
          </mesh>
        ))}
        <mesh geometry={geometries.rosette} position={[0, 0.55, 0]} scale={1.2} castShadow>
          <meshStandardMaterial color={BUTTERCREAM} roughness={0.55} />
        </mesh>

        <Shard
          position={[0.44, 0.72, 0.3]}
          rotation={[0.3, 0.6, 0.42]}
          scale={1}
          material={materials.chocolate}
        />
        <Shard
          position={[-0.38, 0.7, -0.26]}
          rotation={[-0.26, -0.45, -0.36]}
          scale={0.82}
          material={materials.chocolate}
        />
        <Shard
          position={[0.06, 0.73, -0.5]}
          rotation={[0.22, 1.15, 0.3]}
          scale={0.9}
          material={materials.chocolate}
        />

        <Cherry position={[0, 0.85, 0]} segments={small} />
        <Cherry position={[0.62, 0.62, -0.42]} scale={0.8} segments={small} />
        <Cherry position={[-0.58, 0.62, 0.46]} scale={0.72} segments={small} />

        {/* Gold leaf. Tiny, but it is what makes it look finished. */}
        {flecks.map((p, i) => (
          <mesh key={i} position={p} rotation={[i * 0.9, i * 1.7, i * 0.4]} scale={0.045}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Framing                                                              */
/* ------------------------------------------------------------------ */

/**
 * Scales the model so it always fits the canvas, whatever shape that is.
 * A fixed camera looks right at one size and crops the stand at every other,
 * which is exactly what it used to do on shorter screens.
 */
function Fit({ children, span = 3.5, width = 3.2 }) {
  const viewport = useThree((state) => state.viewport)
  const scale = Math.min((viewport.height * 0.9) / span, (viewport.width * 0.9) / width)
  return <group scale={scale}>{children}</group>
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export default function CakeScene({ bright = true, quality = 'high' }) {
  const high = quality === 'high'

  return (
    <Canvas
      shadows={high ? 'percentage' : false}
      /* The phone canvas is small, so a 2× buffer is cheap and it is what
         stops the drips looking faceted on a retina screen. */
      dpr={high ? [1, 1.75] : [1, 2]}
      /* Looking slightly down on it: from level with the cake you lose the
         piped top entirely, which is the part worth showing. */
      camera={{ position: [0, 1.15, 6.7], fov: 30 }}
      gl={{ antialias: high, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ touchAction: 'pan-y', background: 'transparent' }}
    >
      <ambientLight intensity={bright ? 0.9 : 0.5} />
      <directionalLight
        position={[4, 6.5, 4]}
        intensity={bright ? 2.2 : 2.7}
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      {/* Rim light from behind — this is what lifts the cake off the backdrop. */}
      <directionalLight position={[-3.5, 2.5, -4]} intensity={bright ? 1.5 : 2.2} color="#FFD9A8" />
      <pointLight position={[0, 3, 2]} intensity={bright ? 10 : 16} color="#FFE2BB" distance={10} />

      <Fit>
        {/* Drag to turn it, then it springs back and carries on drifting. */}
        <PresentationControls
          global
          snap
          speed={1.1}
          zoom={1}
          rotation={[0.06, -0.3, 0]}
          polar={[-0.12, 0.3]}
          azimuth={[-0.7, 0.7]}
          config={{ mass: 1.4, tension: 220 }}
        >
          <Float rotationIntensity={0.14} floatIntensity={0.4} speed={1.3}>
            <CakeModel high={high} />
          </Float>
        </PresentationControls>

        <ContactShadows
          position={[0, -1.44, 0]}
          opacity={bright ? 0.34 : 0.5}
          scale={6.5}
          blur={2.4}
          far={3}
          resolution={high ? 512 : 256}
          color="#2A1810"
        />
      </Fit>

      {/* Reflections come from shapes we place ourselves rather than a
          downloaded HDRI, so the scene works offline and adds no requests. */}
      <Environment resolution={high ? 256 : 128} environmentIntensity={bright ? 0.8 : 0.55}>
        <Lightformer form="rect" intensity={bright ? 3 : 2.2} position={[0, 5, -2]} scale={[10, 6, 1]} color="#FFF3E2" />
        <Lightformer form="circle" intensity={bright ? 2.4 : 1.8} position={[-4, 2, 3]} scale={5} color="#FFD9A8" />
        <Lightformer form="circle" intensity={1.3} position={[4, 1, 3]} scale={4} color="#F6E7D0" />
        <Lightformer form="rect" intensity={0.8} position={[0, -3, 2]} scale={[8, 4, 1]} color="#E8C9A0" />
      </Environment>
    </Canvas>
  )
}
