// @ts-nocheck
import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import styles from '../../styles/Home.module.scss'
import { ProjectItem } from '../../sanity/queries'
import {
  SVG_SHAPES,
  DEFAULT_ZOOM_Z,
  ZOOM_PERCENT_STEP,
  ZOOM_PERCENT_MIN,
  ZOOM_PERCENT_MAX,
  SceneMode,
} from './constants'
import Connector from './Connector'
import CameraZoom from './CameraZoom'

// Vertical spacing between objects in column mode (in world units)
const COLUMN_SPACING = 3

export default function Scene({ projects = [], ready = false, onSelectProject }: {
  projects?: ProjectItem[];
  ready?: boolean;
  onSelectProject?: (project: ProjectItem) => void;
}) {
  const [labels, setLabels] = useState<Record<number, { x: number; y: number }>>({})
  const [hoveredSet, setHoveredSet] = useState<Set<number>>(new Set())
  const [zoomPercent, setZoomPercent] = useState(() => {
    if (typeof window === 'undefined') return 100
    const saved = localStorage.getItem('zoomPercent')
    return saved ? Number(saved) : 100
  })
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('muted') === 'true'
  })
  const [sceneMode, setSceneMode] = useState<SceneMode>(() => {
    if (typeof window === 'undefined') return 'magnetic'
    return (localStorage.getItem('sceneMode') as SceneMode) || 'magnetic'
  })
  const [scrollOffset, setScrollOffset] = useState(0)

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m
      localStorage.setItem('muted', String(next))
      return next
    })
  }, [])
  const zoomZ = DEFAULT_ZOOM_Z / (zoomPercent / 100)

  const zoomIn = useCallback(() => {
    setZoomPercent((p) => {
      const next = Math.min(ZOOM_PERCENT_MAX, p + ZOOM_PERCENT_STEP)
      localStorage.setItem('zoomPercent', String(next))
      return next
    })
  }, [])
  const zoomOut = useCallback(() => {
    setZoomPercent((p) => {
      const next = Math.max(ZOOM_PERCENT_MIN, p - ZOOM_PERCENT_STEP)
      localStorage.setItem('zoomPercent', String(next))
      return next
    })
  }, [])

  const toggleSceneMode = useCallback(() => {
    setSceneMode((m) => {
      const next = m === 'magnetic' ? 'column' : 'magnetic'
      if (next === 'column') setScrollOffset(0)
      localStorage.setItem('sceneMode', next)
      return next as SceneMode
    })
  }, [])

  // Sort projects by year desc for column mode, keep original index mapping
  const sortedIndices = useMemo(() => {
    const indices = projects.map((_, i) => i)
    indices.sort((a, b) => (projects[b].year ?? 0) - (projects[a].year ?? 0))
    return indices
  }, [projects])

  // Compute target positions for column mode: sorted by year, offset by scroll
  const columnTargets = useMemo(() => {
    const targets: Record<number, [number, number, number]> = {}
    sortedIndices.forEach((projectIndex, sortedPos) => {
      const connectorIndex = projectIndex + 1 // Connector uses 1-based index
      const y = -sortedPos * COLUMN_SPACING + scrollOffset
      targets[connectorIndex] = [0, y, 2]
    })
    return targets
  }, [sortedIndices, scrollOffset])

  // Scroll handler for column mode
  useEffect(() => {
    if (sceneMode !== 'column') return
    const maxScroll = (projects.length - 1) * COLUMN_SPACING
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setScrollOffset((prev) => {
        const next = prev + e.deltaY * 0.01
        return Math.max(0, Math.min(maxScroll, next))
      })
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [sceneMode, projects.length])

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

  const canvasClass = sceneMode === 'column' ? styles.canvasColumnMode : undefined

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 40 }}
        className={canvasClass}
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
        <CameraZoom targetZ={zoomZ} />
        <ambientLight intensity={2} />
        <directionalLight position={[0, 0, 10]} intensity={0.6} />
        <directionalLight position={[3, -2, 8]} intensity={0.35} />
        <directionalLight position={[-3, 2, 8]} intensity={0.35} />
        <Physics gravity={[0, 0, 0]}>
          {projects.map((project, i) => (
            <Connector
              key={project._id}
              index={i + 1}
              coverUrl={project.coverUrl}
              svgFile={svgAssignments[i]}
              ready={ready}
              anyDragging={draggedRef}
              muted={muted}
              sceneMode={sceneMode}
              targetPosition={columnTargets[i + 1]}
              onScreenUpdate={onScreenUpdate}
              onHover={onHover}
              onDragChange={onDragChange}
              onClick={(index: number) => {
                const p = projects[index - 1]
                if (p) onSelectProject?.(p)
              }}
            />
          ))}
        </Physics>
        <EffectComposer disableNormalPass multisampling={8}>
          <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
        </EffectComposer>
        <Environment background={false}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={2} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="circle" intensity={1} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
            <Lightformer form="circle" intensity={1} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
            <Lightformer form="circle" intensity={1} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          </group>
        </Environment>
      </Canvas>
      {/* DOM overlay — labels */}
      <div className={styles.labelOverlay}>
        {Object.entries(labels).map(([idx, pos]) => {
          const i = Number(idx)
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
      {/* Controls */}
      <div className={styles.controls}>
        <button className={`${styles.zoomBtn} ${zoomPercent <= ZOOM_PERCENT_MIN ? styles.zoomBtnHidden : ''}`}
                onClick={zoomOut} aria-label="Zoom out">
          <span className={styles.zoomMinus}/>
        </button>
        <button className={`${styles.zoomBtn} ${zoomPercent >= ZOOM_PERCENT_MAX ? styles.zoomBtnHidden : ''}`}
                onClick={zoomIn} aria-label="Zoom in">
          <span className={styles.zoomPlus}/>
        </button>
        <span className={styles.zoomValue}>{zoomPercent}%</span>

        <button className={styles.modeBtn} onClick={toggleSceneMode} aria-label="Toggle scene mode">
          <img src={sceneMode === 'magnetic' ? '/list.svg' : '/group.svg'} alt=""/>
        </button>

        <button className={styles.muteBtn} onClick={toggleMuted} aria-label={muted ? 'Unmute' : 'Mute'}>
          <img src={muted ? '/muted.svg' : '/unmuted.svg'} alt="" width={20} height={15}/>
        </button>

      </div>
    </>
  )
}
