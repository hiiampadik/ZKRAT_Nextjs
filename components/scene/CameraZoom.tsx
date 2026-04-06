import { useFrame } from '@react-three/fiber'

export default function CameraZoom({ targetZ }: { targetZ: number }) {
  useFrame(({ camera }) => {
    camera.position.z += (targetZ - camera.position.z) * 0.08
  })
  return null
}
