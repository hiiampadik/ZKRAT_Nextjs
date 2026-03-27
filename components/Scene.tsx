// @ts-nocheck
import * as THREE from 'three'
import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { ConvexHullCollider, Physics, RigidBody } from '@react-three/rapier'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import styles from '../styles/Home.module.scss'
import { ProjectItem } from '../sanity/queries'

const CONNECTOR_SCALE = 6
const SVG_SHAPE_SCALE = 0.002 * CONNECTOR_SCALE

const SVG_SHAPES = [
  'sh1.svg',
  'sh2.svg',
  'sh3.svg',
  'sh4.svg',
  'sh5.svg',
  'sh6.svg',
  'sh7.svg',
  'sh8.svg',
]

function useDataUrlTexture(dataUrl: string | null) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    if (!dataUrl) return
    const loader = new THREE.TextureLoader()
    loader.load(dataUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      setTexture(tex)
    })
  }, [dataUrl])
  return texture
}

function useSvgGeometry(svgFile: string) {
  const svgData = useLoader(SVGLoader, `/${svgFile}`)
  return useMemo(() => {
    const shapes: THREE.Shape[] = []
    svgData.paths.forEach((path) => {
      const s = SVGLoader.createShapes(path)
      shapes.push(...s)
    })
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 30,
      bevelEnabled: false,
    })
    geo.center()
    // Split shared vertices so each face has its own normals (prevents light bleeding across edges)
    const nonIndexed = geo.toNonIndexed()
    nonIndexed.computeBoundingBox()
    // Remap UVs to 0–1 range based on bounding box so textures display correctly
    const bb = nonIndexed.boundingBox!
    const uvAttr = nonIndexed.getAttribute('uv')
    if (uvAttr) {
      for (let i = 0; i < uvAttr.count; i++) {
        const x = nonIndexed.getAttribute('position').getX(i)
        const y = nonIndexed.getAttribute('position').getY(i)
        uvAttr.setXY(
          i,
          (x - bb.min.x) / (bb.max.x - bb.min.x),
          (y - bb.min.y) / (bb.max.y - bb.min.y)
        )
      }
      uvAttr.needsUpdate = true
    }
    nonIndexed.computeVertexNormals()
    return nonIndexed
  }, [svgData])
}

function useSvgColliderVertices(svgFile: string): Float32Array | null {
  const geometry = useSvgGeometry(svgFile)
  return useMemo(() => {
    if (!geometry) return null
    const pos = geometry.getAttribute('position')
    const vertices = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      vertices[i * 3] = pos.getX(i) * SVG_SHAPE_SCALE
      vertices[i * 3 + 1] = pos.getY(i) * SVG_SHAPE_SCALE
      vertices[i * 3 + 2] = pos.getZ(i) * SVG_SHAPE_SCALE
    }
    return vertices
  }, [geometry])
}

function Connector({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  index,
  onScreenUpdate,
  onHover,
  onDragChange,
  onClick,
  ready,
  anyDragging,
  ...props
}: any) {
  const api = useRef<any>(null)
  const pos = useMemo(() => {
    if (position) return position
    // Spawn outside the visible viewport (visible area is ~±2.5 units)
    const minDist = 5
    let x: number, y: number
    do {
      x = r(25)
      y = r(25)
    } while (Math.abs(x) < minDist && Math.abs(y) < minDist)
    return [x, y, r(10)]
  }, [])
  const [hovered, setHovered] = useState(false)
  const clickSound = useMemo(() => {
    if (typeof window === 'undefined') return null
    const audio = new Audio('/click.mp3')
    audio.volume = 0.5
    return audio
  }, [])
  const dragging = useRef(false)
  const dragStart = useRef(new THREE.Vector2())
  const wasDragged = useRef(false)
  const velocity = useRef(new THREE.Vector2())
  const worldPos = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ mouse, viewport, camera, size }) => {
    // Attract toward center — skip during drag or before ready, weaken near center to avoid jitter
    if (!dragging.current && ready) {
      const t = api.current?.translation()
      if (t) {
        const dist = Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z)
        // Dead zone — stop attracting when close to center to prevent vibration
        if (dist > 1.2) {
          const strength = Math.min(dist * 0.3, 2.0)
          api.current.applyImpulse(vec.set(-t.x * strength, -t.y * strength, -t.z * strength))
        }
      }
    }

    // Project world position to screen for label overlay
    const translation = api.current?.translation()
    if (translation && onScreenUpdate) {
      worldPos.set(translation.x, translation.y, translation.z)
      worldPos.project(camera)
      const x = (worldPos.x * 0.5 + 0.5) * size.width
      const y = (-worldPos.y * 0.5 + 0.5) * size.height
      onScreenUpdate(index, x, y)
    }

    if (dragging.current && translation) {
      const targetX = (mouse.x * viewport.width) / 2
      const targetY = (mouse.y * viewport.height) / 2
      const springFactor = 0.12
      const newX = translation.x + (targetX - translation.x) * springFactor
      const newY = translation.y + (targetY - translation.y) * springFactor
      velocity.current.set(newX - translation.x, newY - translation.y)
      api.current.setNextKinematicTranslation({ x: newX, y: newY, z: translation.z })
    }
  })

  const onPointerDown = (e: any) => {
    e.stopPropagation()
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    dragging.current = true
    wasDragged.current = false
    dragStart.current.set(e.clientX, e.clientY)
    api.current?.wakeUp()
    api.current?.setBodyType(2)
    onDragChange?.(index, true)
  }

  const onPointerUp = (e: any) => {
    if (!dragging.current) return
    dragging.current = false
    api.current?.setBodyType(0)
    api.current?.wakeUp()
    onDragChange?.(index, false)

    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 5) {
      onClick?.(index)
    } else {
      const impulseStrength = 15
      api.current?.applyImpulse({
        x: velocity.current.x * impulseStrength,
        y: velocity.current.y * impulseStrength,
        z: 0,
      }, true)
    }
    velocity.current.set(0, 0)
  }

  const svgFile = props.svgFile || SVG_SHAPES[0]
  const svgVertices = useSvgColliderVertices(svgFile)

  return (
    <RigidBody linearDamping={12} angularDamping={4} friction={0.5} restitution={0.1} position={pos} ref={api} colliders={false}>
      {svgVertices && <ConvexHullCollider args={[svgVertices]} />}
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          if (anyDragging?.current !== null) return
          setHovered(true)
          onHover?.(index, true)
          if (clickSound) {
            clickSound.currentTime = 0
            clickSound.play()
          }
        }}
        onPointerOut={() => {
          if (anyDragging?.current !== null && !dragging.current) return
          setHovered(false)
          onHover?.(index, false)
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {children ? children : <SvgModel hovered={hovered} svgFile={svgFile} coverUrl={props.coverUrl} />}
      </group>
    </RigidBody>
  )
}

function SvgModel({ hovered = false, coverUrl, svgFile }: any): any {
  const texture = useDataUrlTexture(coverUrl)
  const geometry = useSvgGeometry(svgFile)
  const matRef = useRef<any>(null)

  useEffect(() => {
    if (matRef.current && texture) {
      matRef.current.map = texture
      matRef.current.needsUpdate = true
    }
  }, [texture])

  return (
    <mesh castShadow receiveShadow geometry={geometry} scale={SVG_SHAPE_SCALE}>
      <meshStandardMaterial
        ref={matRef}
        color={'#888'}
        emissive={hovered ? '#555' : '#222'}
        metalness={0.4}
        roughness={0.3}
      />
    </mesh>
  )
}

export default function Scene({ projects = [], ready = false, onSelectProject }: { projects?: ProjectItem[]; ready?: boolean; onSelectProject?: (project: ProjectItem) => void }) {
  const [labels, setLabels] = useState<Record<number, { x: number; y: number }>>({})
  const [hoveredSet, setHoveredSet] = useState<Set<number>>(new Set())

  // Randomly assign an SVG file to each project
  const svgAssignments = useMemo(
    () => projects.map(() => SVG_SHAPES[Math.floor(Math.random() * SVG_SHAPES.length)]),
    [projects.length]
  )

  const onScreenUpdate = useCallback((index: number, x: number, y: number) => {
    setLabels((prev) => {
      const old = prev[index]
      if (old && Math.abs(old.x - x) < 0.5 && Math.abs(old.y - y) < 0.5) return prev
      return { ...prev, [index]: { x, y } }
    })
  }, [])

  const onHover = useCallback((index: number, hovered: boolean) => {
    setHoveredSet((prev) => {
      const next = new Set(prev)
      if (hovered) next.add(index)
      else next.delete(index)
      return next
    })
  }, [])

  const draggedRef = useRef<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const onDragChange = useCallback((index: number, isDragging: boolean) => {
    draggedRef.current = isDragging ? index : null
    setDraggedIndex(isDragging ? index : null)
  }, [])

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          background: 'transparent',
        }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[0, 0, 10]} intensity={0.6} />
        <directionalLight position={[3, -2, 8]} intensity={0.35} />
        <directionalLight position={[-3, 2, 8]} intensity={0.35} />
        <Physics gravity={[0, 0, 0]}>
          {projects.map((project, i) => (
            <Connector key={project._id} index={i + 1} coverUrl={project.coverUrl} svgFile={svgAssignments[i]} ready={ready} anyDragging={draggedRef} onScreenUpdate={onScreenUpdate} onHover={onHover} onDragChange={onDragChange} onClick={(index: number) => { const p = projects[index - 1]; if (p) onSelectProject?.(p) }} />
          ))}
        </Physics>
        <EffectComposer disableNormalPass multisampling={8}>
          <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
        </EffectComposer>
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={2} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="circle" intensity={1} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
            <Lightformer form="circle" intensity={1} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
            <Lightformer form="circle" intensity={1} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          </group>
        </Environment>
      </Canvas>
      {/* DOM overlay — labels always top-right of object center, unaffected by 3D rotation */}
      <div className={styles.labelOverlay}>
        {Object.entries(labels).map(([idx, pos]) => {
          const i = Number(idx)
          // When dragging, only show label for the dragged object
          if (draggedIndex !== null) {
            if (i !== draggedIndex) return null
          } else {
            if (!hoveredSet.has(i)) return null
          }
          const project = projects[i - 1]
          if (!project) return null
          return (
              <div
                  key={i}
                  className={styles.label}
                  style={{
                    left: pos.x + 15,
                    top: pos.y - 25,
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                  }}
              >
                <p>{project.titleEn}</p>
                <p>{project.year}</p>
              </div>
          )
        })}
      </div>
    </>
  )
}
