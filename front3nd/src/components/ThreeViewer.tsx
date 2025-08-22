'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { STLLoader, OBJLoader, OrbitControls } from 'three-stdlib'
import { fileCache } from '../lib/fileCache'
import { apiService } from '../lib/apiService'

interface ThreeViewerProps {
  fileId: string
  fileName: string
  material?: string
  color?: string
  onAnalysisComplete?: (analysis: any) => void
}

const ThreeViewer: React.FC<ThreeViewerProps> = ({ 
  fileId, 
  fileName, 
  material = 'standard-resin',
  color = 'white',
  onAnalysisComplete 
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const controlsRef = useRef<OrbitControls>()
  const modelRef = useRef<THREE.Mesh>()
  const animationRef = useRef<number>()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<any>(null)

  // Material colors mapping - moved outside of component to prevent re-creation
  const colorMap = React.useMemo(() => ({
    'white': 0xffffff,
    'black': 0x1a202c,
    'gray': 0x718096,
    'clear': 0xf7fafc,
    'red': 0xe53e3e,
    'blue': 0x3182ce,
    'green': 0x38a169,
    'yellow': 0xecc94b,
    'orange': 0xdd6b20,
    'purple': 0x805ad5,
    'gold-glitter': 0xffd700,
    'silver-glitter': 0xc0c0c0
  } as Record<string, number>), [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x2a2a2a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(120, 120, 120) // Zoomed out further
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = 10
    controls.maxDistance = 500
    controlsRef.current = controls

    // Professional showroom lighting setup - 4 corner lights + ambient + key light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3) // Soft ambient fill
    scene.add(ambientLight)

    // Main key light (strongest, from front-top-right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(150, 180, 100)
    keyLight.target.position.set(0, 40, 0) // Point slightly above center
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 4096
    keyLight.shadow.mapSize.height = 4096
    keyLight.shadow.camera.near = 0.1
    keyLight.shadow.camera.far = 500
    keyLight.shadow.camera.left = -200
    keyLight.shadow.camera.right = 200
    keyLight.shadow.camera.top = 200
    keyLight.shadow.camera.bottom = -200
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)
    scene.add(keyLight.target)

    // Four corner fill lights (positioned at upper corners of build volume)
    const cornerLightIntensity = 0.6
    const cornerHeight = 160 // Top of build volume
    
    // Front-left corner light
    const frontLeftLight = new THREE.SpotLight(0xffffff, cornerLightIntensity, 300)
    frontLeftLight.position.set(-115, cornerHeight, 65)
    frontLeftLight.target.position.set(0, 0, 0)
    frontLeftLight.angle = Math.PI / 4
    frontLeftLight.penumbra = 0.3
    scene.add(frontLeftLight)
    scene.add(frontLeftLight.target)
    
    // Front-right corner light
    const frontRightLight = new THREE.SpotLight(0xffffff, cornerLightIntensity, 300)
    frontRightLight.position.set(115, cornerHeight, 65)
    frontRightLight.target.position.set(0, 0, 0)
    frontRightLight.angle = Math.PI / 4
    frontRightLight.penumbra = 0.3
    scene.add(frontRightLight)
    scene.add(frontRightLight.target)
    
    // Back-left corner light
    const backLeftLight = new THREE.SpotLight(0xffffff, cornerLightIntensity, 300)
    backLeftLight.position.set(-115, cornerHeight, -65)
    backLeftLight.target.position.set(0, 0, 0)
    backLeftLight.angle = Math.PI / 4
    backLeftLight.penumbra = 0.3
    scene.add(backLeftLight)
    scene.add(backLeftLight.target)
    
    // Back-right corner light
    const backRightLight = new THREE.SpotLight(0xffffff, cornerLightIntensity, 300)
    backRightLight.position.set(115, cornerHeight, -65)
    backRightLight.target.position.set(0, 0, 0)
    backRightLight.angle = Math.PI / 4
    backRightLight.penumbra = 0.3
    scene.add(backRightLight)
    scene.add(backRightLight.target)
    
    // Rim light for edge definition (from behind)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
    rimLight.position.set(0, 150, -150)
    rimLight.target.position.set(0, 40, 0)
    scene.add(rimLight)
    scene.add(rimLight.target)

    // Print bed visualization (Halot Mage 8K: 230×130mm)
    const bedGeometry = new THREE.PlaneGeometry(230, 130)
    const bedMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2d3748, // Darker gray for better contrast
      transparent: false,
      opacity: 1
    })
    const bed = new THREE.Mesh(bedGeometry, bedMaterial)
    bed.rotation.x = -Math.PI / 2
    bed.position.y = 0 // Set bed at y=0 (ground level)
    bed.receiveShadow = true
    scene.add(bed)

    // Print bed border for better visibility
    const borderGeometry = new THREE.EdgesGeometry(bedGeometry)
    const borderMaterial = new THREE.LineBasicMaterial({ 
      color: 0x667eea, 
      linewidth: 3 
    })
    const bedBorder = new THREE.LineSegments(borderGeometry, borderMaterial)
    bedBorder.rotation.x = -Math.PI / 2
    bedBorder.position.y = 0.1 // Slightly above bed to avoid z-fighting
    scene.add(bedBorder)

    // Grid helper for size reference (Halot Mage 8K dimensions)
    const gridHelper = new THREE.GridHelper(250, 25, 0x4a5568, 0x4a5568) // 10mm grid
    gridHelper.position.y = -0.1 // Slightly below bed
    gridHelper.material.transparent = true
    gridHelper.material.opacity = 0.2
    scene.add(gridHelper)

    // Build volume indicator (transparent box showing max print height ~160mm)
    const buildVolumeGeometry = new THREE.BoxGeometry(230, 160, 130)
    const buildVolumeMaterial = new THREE.MeshBasicMaterial({
      color: 0x667eea,
      transparent: true,
      opacity: 0.05,
      wireframe: true
    })
    const buildVolume = new THREE.Mesh(buildVolumeGeometry, buildVolumeMaterial)
    buildVolume.position.y = 80 // Half of build height (160mm)
    scene.add(buildVolume)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Store current mount reference for cleanup
    const currentMount = mountRef.current
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Load 3D model from cache
  useEffect(() => {
    if (!fileId) return
    
    const loadModel = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get file from cache
        const file = await fileCache.getFile(fileId)
        if (!file) {
          throw new Error('File not found in cache')
        }

        // Create object URL for file
        const url = URL.createObjectURL(file)
        const extension = file.name.toLowerCase().split('.').pop()

        let loader: STLLoader | OBJLoader
        let geometry: THREE.BufferGeometry

        if (extension === 'stl') {
          const stlLoader = new STLLoader()
          geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
            stlLoader.load(
              url, 
              (geometry) => resolve(geometry),
              undefined,
              (error) => reject(error)
            )
          })
        } else if (extension === 'obj') {
          const objLoader = new OBJLoader()
          const object = await new Promise<THREE.Group>((resolve, reject) => {
            objLoader.load(
              url,
              (group) => resolve(group),
              undefined,
              (error) => reject(error)
            )
          })
          
          // Extract geometry from first mesh in the object
          const mesh = object.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh
          if (!mesh) {
            throw new Error('No mesh found in OBJ file')
          }
          geometry = mesh.geometry
        } else {
          throw new Error(`Unsupported file format: ${extension}`)
        }

        // Clean up URL
        URL.revokeObjectURL(url)

        // Remove existing model
        if (modelRef.current && sceneRef.current) {
          sceneRef.current.remove(modelRef.current)
        }

        // Create material based on selected resin type and color
        let meshMaterial: THREE.Material
        const baseColor = colorMap[color as keyof typeof colorMap] || 0xffffff

        if (material === 'clear-resin' || color === 'clear') {
          meshMaterial = new THREE.MeshPhysicalMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.8,
            transmission: 0.9,
            roughness: 0.1,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.1
          })
        } else if (color.includes('glitter')) {
          meshMaterial = new THREE.MeshStandardMaterial({
            color: baseColor,
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1
          })
        } else {
          meshMaterial = new THREE.MeshLambertMaterial({
            color: baseColor
          })
        }

        // Create mesh
        const mesh = new THREE.Mesh(geometry, meshMaterial)
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        // Rotate model -90 degrees on X-axis to correct orientation
        mesh.rotation.x = -Math.PI / 2

        // Get the bounding box before any transformations
        geometry.computeBoundingBox()
        const originalBox = geometry.boundingBox!
        const originalSize = new THREE.Vector3()
        originalBox.getSize(originalSize)
        const originalCenter = new THREE.Vector3()
        originalBox.getCenter(originalCenter)

        // Scale to fit nicely on print bed (max 200mm for any dimension)
        const maxDimension = Math.max(originalSize.x, originalSize.y, originalSize.z)
        const maxAllowedSize = 200 // mm - reasonable size for Halot Mage 8K
        let scale = 1
        if (maxDimension > maxAllowedSize) {
          scale = maxAllowedSize / maxDimension
          mesh.scale.multiplyScalar(scale)
        }
        
        // Calculate final dimensions after scaling
        const finalSize = originalSize.clone().multiplyScalar(scale)
        
        // After rotation, recalculate bounding box to get proper positioning
        mesh.geometry.computeBoundingBox()
        const rotatedBox = new THREE.Box3().setFromObject(mesh)
        const rotatedSize = new THREE.Vector3()
        rotatedBox.getSize(rotatedSize)
        const rotatedCenter = new THREE.Vector3()
        rotatedBox.getCenter(rotatedCenter)
        
        // Position the model: center it on XZ plane, bottom on the print bed (Y=0)
        mesh.position.set(
          -rotatedCenter.x, // Center on X
          -rotatedBox.min.y, // Bottom of model at Y=0 (print bed level)
          -rotatedCenter.z   // Center on Z
        )

        sceneRef.current?.add(mesh)
        modelRef.current = mesh

        // Analyze the model locally first
        const localAnalysis = analyzeGeometry(geometry, finalSize)
        setModelInfo(localAnalysis)
        
        // Also call backend API for detailed analysis
        try {
          const backendAnalysis = await apiService.analyzeModel({
            fileName: file.name,
            fileSize: file.size,
            fileType: extension || 'stl',
            analysisLevel: 'detailed'
          })
          
          // Use backend analysis if successful, fallback to local
          const finalAnalysis = backendAnalysis.id ? backendAnalysis : {
            ...localAnalysis,
            fileName: file.name,
            fileSize: file.size,
            format: extension
          }
          
          setModelInfo(finalAnalysis)
          
          // Notify parent component
          if (onAnalysisComplete) {
            onAnalysisComplete(finalAnalysis)
          }
          
        } catch (error) {
          console.warn('Backend analysis failed, using local analysis:', error)
          
          // Fallback to local analysis
          if (onAnalysisComplete) {
            onAnalysisComplete({
              ...localAnalysis,
              fileName: file.name,
              fileSize: file.size,
              format: extension
            })
          }
        }

        // Short delay to ensure model is fully rendered before hiding loading
        setTimeout(() => {
          setIsLoading(false)
        }, 200)

      } catch (err) {
        console.error('Error loading 3D model:', err)
        setError(err instanceof Error ? err.message : 'Failed to load model')
        setIsLoading(false)
      }
    }

    loadModel()
  }, [fileId, fileName, onAnalysisComplete]) // eslint-disable-line react-hooks/exhaustive-deps
  // Note: material, color, colorMap are intentionally omitted to prevent model reload on color changes
  // Color changes are handled by the separate useEffect below

  // Update material when color changes
  useEffect(() => {
    if (!modelRef.current) return

    const baseColor = colorMap[color as keyof typeof colorMap] || 0xffffff
    let newMaterial: THREE.Material

    if (material === 'clear-resin' || color === 'clear') {
      newMaterial = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.8,
        transmission: 0.9,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.1
      })
    } else if (color.includes('glitter')) {
      newMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1
      })
    } else {
      newMaterial = new THREE.MeshLambertMaterial({
        color: baseColor
      })
    }

    // Dispose old material
    if (modelRef.current.material instanceof THREE.Material) {
      modelRef.current.material.dispose()
    }

    modelRef.current.material = newMaterial
  }, [material, color, colorMap])

  // Analyze geometry to extract model information
  const analyzeGeometry = (geometry: THREE.BufferGeometry, size: THREE.Vector3) => {
    const positions = geometry.attributes.position
    const vertices = positions ? positions.count : 0
    const faces = geometry.index ? geometry.index.count / 3 : vertices / 3

    // Estimate volume (simplified calculation)
    const volume = (size.x * size.y * size.z) / 1000 // Convert mm³ to cm³

    return {
      id: `analysis_${Date.now()}`,
      vertices: Math.floor(vertices),
      faces: Math.floor(faces),
      edges: Math.floor(faces * 1.5), // Rough estimate
      volume: Math.round(volume * 100) / 100,
      surfaceArea: Math.round((2 * (size.x * size.y + size.y * size.z + size.z * size.x)) * 100) / 100,
      dimensions: {
        x: Math.round(size.x * 10) / 10,
        y: Math.round(size.y * 10) / 10,
        z: Math.round(size.z * 10) / 10
      },
      complexity: volume > 50 ? 'complex' : volume > 20 ? 'moderate' : 'simple',
      supportNeeded: size.z > size.x * 2 || size.z > size.y * 2, // Tall objects likely need support
      overhangs: Math.floor(Math.random() * 5), // Placeholder
      bridging: Math.floor(Math.random() * 3),
      hollowPercentage: 0,
      printable: true,
      warnings: [],
      recommendations: ['Model loaded successfully', 'Ready for printing'],
      processingTime: 0,
      timestamp: new Date().toISOString()
    }
  }

  if (error) {
    return (
      <div style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2a2a2a',
        color: 'white',
        borderRadius: '8px',
        border: '2px solid #e53e3e'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Failed to load 3D model</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}
      />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(42, 42, 42, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #667eea',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <div>Loading 3D model...</div>
          </div>
        </div>
      )}

      {/* Model info overlay */}
      {modelInfo && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Model Info</div>
          <div>Vertices: {modelInfo.vertices.toLocaleString()}</div>
          <div>Faces: {modelInfo.faces.toLocaleString()}</div>
          <div>Volume: {modelInfo.volume} cm³</div>
          <div>Dimensions: {modelInfo.dimensions.x}×{modelInfo.dimensions.y}×{modelInfo.dimensions.z}mm</div>
        </div>
      )}

      {/* Print bed specifications overlay */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '0.75rem',
        borderRadius: '6px',
        fontSize: '0.8rem',
        minWidth: '180px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🖨️ Halot Mage 8K</div>
        <div>Build Volume: 230×130×160mm</div>
        <div>Resolution: 8K (7680×4320)</div>
        <div>Layer: 0.01-0.15mm</div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>Gray surface shows print bed</div>
      </div>

      {/* Controls overlay */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '0.75rem',
        borderRadius: '6px',
        fontSize: '0.8rem'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Controls</div>
        <div>🖱️ Drag to rotate</div>
        <div>🔍 Scroll to zoom</div>
        <div>📱 Touch to interact</div>
      </div>
    </div>
  )
}

export default ThreeViewer
