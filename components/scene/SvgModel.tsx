// @ts-nocheck
import * as THREE from 'three'
import { useRef, useMemo, useState, useEffect } from 'react'
import { useLoader } from '@react-three/fiber'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import { SVG_SHAPE_SCALE } from './constants'

export function useDataUrlTexture(dataUrl: string | null) {
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

export function useSvgGeometry(svgFile: string) {
  const svgData = useLoader(SVGLoader, `/${svgFile}`)
  return useMemo(() => {
    const shapes: THREE.Shape[] = []
    svgData.paths.forEach((path) => {
      const s = SVGLoader.createShapes(path)
      shapes.push(...s)
    })
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 20,
      bevelEnabled: false,
    })
    geo.center()
    const nonIndexed = geo.toNonIndexed()
    nonIndexed.computeBoundingBox()
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

export function useSvgColliderVertices(svgFile: string): Float32Array | null {
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

export default function SvgModel({ hovered = false, coverUrl, svgFile }: any): any {
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
        color={'#999'}
        emissive={hovered ? '#555' : '#111'}
        metalness={0.6}
        roughness={0.3}
      />
    </mesh>
  )
}
