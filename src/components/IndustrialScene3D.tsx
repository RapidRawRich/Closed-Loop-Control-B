import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type MachineType = 'heatExchanger' | 'controlValve' | 'pHTank';

interface IndustrialScene3DProps {
  machineType: MachineType;
  operatingPoint: number; // 0 to 100%
  flowRate?: number; // 10 to 100%
  pHValue?: number; // 0 to 14
  distortionCoeff?: number; // 0.1 to 1.0
  className?: string;
}

export const IndustrialScene3D: React.FC<IndustrialScene3DProps> = ({
  machineType,
  operatingPoint,
  flowRate = 50,
  pHValue = 7,
  distortionCoeff = 0.5,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);
  
  // Dynamic component refs
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const valveStemRef = useRef<THREE.Mesh | null>(null);
  const valvePlugRef = useRef<THREE.Mesh | null>(null);
  const heatCoilsRef = useRef<THREE.Mesh[]>([]);
  const liquidMeshRef = useRef<THREE.Mesh | null>(null);
  const bubblesGroupRef = useRef<THREE.Group | null>(null);
  const stirrerRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3, 7.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(5, 10, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const accentLight = new THREE.PointLight(0xf59e0b, 1.5, 15);
    accentLight.position.set(-4, -1, 3);
    scene.add(accentLight);

    // Floor Grid
    const gridHelper = new THREE.GridHelper(14, 28, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Dynamic group for machine
    const machineGroup = new THREE.Group();
    scene.add(machineGroup);
    dynamicGroupRef.current = machineGroup;

    // Mouse rotation interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dynamicGroupRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      dynamicGroupRef.current.rotation.y += deltaX * 0.008;
      dynamicGroupRef.current.rotation.x += deltaY * 0.005;
      // Clamp vertical tilt
      dynamicGroupRef.current.rotation.x = Math.max(-0.4, Math.min(0.6, dynamicGroupRef.current.rotation.x));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Subtle machine idle rotation when not dragging
      if (!isDragging && dynamicGroupRef.current) {
        dynamicGroupRef.current.rotation.y += 0.003;
      }

      // Rotate stirrer in pH tank
      if (stirrerRef.current) {
        stirrerRef.current.rotation.y += (flowRate / 20) * delta * 5;
      }

      // Bubble motion in pH or steam
      if (bubblesGroupRef.current) {
        bubblesGroupRef.current.children.forEach((b) => {
          b.position.y += 0.03 * (b.userData.speed || 1);
          if (b.position.y > 1.8) {
            b.position.y = -1.2;
            b.position.x = (Math.random() - 0.5) * 1.6;
            b.position.z = (Math.random() - 0.5) * 1.6;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Re-build 3D geometry when machineType changes
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    // Clear previous models
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    heatCoilsRef.current = [];
    valveStemRef.current = null;
    valvePlugRef.current = null;
    liquidMeshRef.current = null;
    stirrerRef.current = null;
    bubblesGroupRef.current = null;

    if (machineType === 'heatExchanger') {
      buildHeatExchanger(group, heatCoilsRef, bubblesGroupRef);
    } else if (machineType === 'controlValve') {
      buildControlValve(group, valveStemRef, valvePlugRef);
    } else if (machineType === 'pHTank') {
      buildPHTank(group, liquidMeshRef, stirrerRef, bubblesGroupRef);
    }
  }, [machineType]);

  // Update dynamic values (heat colors, valve stem height, pH color, etc.)
  useEffect(() => {
    // 1. Heat Exchanger
    if (machineType === 'heatExchanger') {
      const heatFraction = operatingPoint / 100;
      // Adjust coil glow from cool orange (0.2) to intense glowing red/yellow
      heatCoilsRef.current.forEach((coil, idx) => {
        const mat = coil.material as THREE.MeshStandardMaterial;
        if (mat) {
          const redVal = 0.4 + heatFraction * 0.6;
          const greenVal = 0.1 + heatFraction * 0.35;
          mat.color.setRGB(redVal, greenVal, 0.1);
          mat.emissive.setRGB(redVal * 0.7, greenVal * 0.4, 0.05);
        }
      });
    }

    // 2. Control Valve Stem Position
    if (machineType === 'controlValve' && valveStemRef.current && valvePlugRef.current) {
      // Installed valve stroke calculation based on distortion coefficient
      // Real valve lift: y = (operatingPoint/100)
      const travel = operatingPoint / 100; // 0 (closed) to 1 (full open)
      // Moving stem upwards as it opens
      valveStemRef.current.position.y = 0.3 + travel * 0.8;
      valvePlugRef.current.position.y = -0.4 + travel * 0.8;
    }

    // 3. pH Tank Liquid Color and Level
    if (machineType === 'pHTank' && liquidMeshRef.current) {
      const mat = liquidMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        // pH Color spectrum: Acid (0-5: Red/Orange) -> Neutral (6-8: Bright Green/Emerald) -> Alkaline (9-14: Deep Violet/Blue)
        let r = 0.1, g = 0.8, b = 0.3; // Neutral green
        if (pHValue < 6) {
          // Acidic (Deep red to orange)
          r = 0.95;
          g = (pHValue / 6) * 0.4;
          b = 0.05;
        } else if (pHValue > 8) {
          // Basic (Blue to purple)
          const factor = (pHValue - 8) / 6;
          r = 0.2 + factor * 0.5;
          g = 0.1;
          b = 0.8 + factor * 0.2;
        } else {
          // Sharp transition near 7
          r = 0.1;
          g = 0.85;
          b = 0.4;
        }
        mat.color.setRGB(r, g, b);
        mat.emissive.setRGB(r * 0.3, g * 0.3, b * 0.3);
      }
    }
  }, [machineType, operatingPoint, flowRate, pHValue, distortionCoeff]);

  return (
    <div className={`relative w-full h-full min-h-[380px] rounded-lg overflow-hidden bg-slate-950 border border-slate-800 ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700/60 px-3 py-1.5 text-xs text-slate-300 pointer-events-none rounded">
        <span className="font-mono text-cyan-400">3D Interaction:</span> Click & drag to rotate view
      </div>
    </div>
  );
};

// ==========================================
// 3D Procedural Builders
// ==========================================

function buildHeatExchanger(
  group: THREE.Group,
  coilsRef: React.MutableRefObject<THREE.Mesh[]>,
  bubblesRef: React.MutableRefObject<THREE.Group | null>
) {
  // Shell (Horizontal cylinder cutaway/transparent)
  const shellGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.4, 32, 1, true);
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0x334155,
    metalness: 0.6,
    roughness: 0.2,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.rotation.z = Math.PI / 2;
  group.add(shell);

  // Shell End Caps
  const capGeo = new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  
  const capLeft = new THREE.Mesh(capGeo, capMat);
  capLeft.rotation.z = -Math.PI / 2;
  capLeft.position.x = -2.2;
  group.add(capLeft);

  const capRight = new THREE.Mesh(capGeo, capMat);
  capRight.rotation.z = Math.PI / 2;
  capRight.position.x = 2.2;
  group.add(capRight);

  // Internal Tube Bundle (Steam tubes)
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0x7c2d12
  });

  const tubePositions = [
    [0, 0], [0.6, 0.4], [-0.6, 0.4], [0.6, -0.4], [-0.6, -0.4],
    [0, 0.8], [0, -0.8], [0.9, 0], [-0.9, 0]
  ];

  tubePositions.forEach(([y, z]) => {
    const tubeGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 16);
    const tube = new THREE.Mesh(tubeGeo, tubeMat.clone());
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, y, z);
    group.add(tube);
    coilsRef.current.push(tube);
  });

  // Inlet & Outlet Nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 16);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });

  // Steam inlet (Top)
  const steamInlet = new THREE.Mesh(nozzleGeo, nozzleMat);
  steamInlet.position.set(-1.2, 2.0, 0);
  group.add(steamInlet);

  // Condensate outlet (Bottom)
  const condensateOutlet = new THREE.Mesh(nozzleGeo, nozzleMat);
  condensateOutlet.position.set(1.2, -2.0, 0);
  group.add(condensateOutlet);

  // Process fluid inlet (Left side)
  const fluidInlet = new THREE.Mesh(nozzleGeo, nozzleMat);
  fluidInlet.rotation.z = Math.PI / 2;
  fluidInlet.position.set(-2.8, 0, 0);
  group.add(fluidInlet);

  // Process fluid outlet (Right side)
  const fluidOutlet = new THREE.Mesh(nozzleGeo, nozzleMat);
  fluidOutlet.rotation.z = Math.PI / 2;
  fluidOutlet.position.set(2.8, 0, 0);
  group.add(fluidOutlet);

  // Steam vapour particle indicators
  const bubblesGroup = new THREE.Group();
  const bubbleGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 20; i++) {
    const b = new THREE.Mesh(bubbleGeo, bubbleMat);
    b.position.set((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
    b.userData = { speed: 0.6 + Math.random() * 0.8 };
    bubblesGroup.add(b);
  }
  group.add(bubblesGroup);
  bubblesRef.current = bubblesGroup;
}

function buildControlValve(
  group: THREE.Group,
  stemRef: React.MutableRefObject<THREE.Mesh | null>,
  plugRef: React.MutableRefObject<THREE.Mesh | null>
) {
  // 1. Valve Body (Globe valve casting)
  const bodyCenterGeo = new THREE.SphereGeometry(1.2, 24, 24);
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Cast iron / carbon steel
    metalness: 0.8,
    roughness: 0.35
  });
  const bodyCenter = new THREE.Mesh(bodyCenterGeo, ironMat);
  bodyCenter.scale.set(1, 0.9, 0.9);
  group.add(bodyCenter);

  // Flow Flanges (Left & Right)
  const pipeGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.6, 24);
  const pipeL = new THREE.Mesh(pipeGeo, ironMat);
  pipeL.rotation.z = Math.PI / 2;
  pipeL.position.x = -1.4;
  group.add(pipeL);

  const pipeR = new THREE.Mesh(pipeGeo, ironMat);
  pipeR.rotation.z = Math.PI / 2;
  pipeR.position.x = 1.4;
  group.add(pipeR);

  // Raised Face Flanges
  const flangeGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.22, 24);
  const flangeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });

  const flangeL = new THREE.Mesh(flangeGeo, flangeMat);
  flangeL.rotation.z = Math.PI / 2;
  flangeL.position.x = -2.1;
  group.add(flangeL);

  const flangeR = new THREE.Mesh(flangeGeo, flangeMat);
  flangeR.rotation.z = Math.PI / 2;
  flangeR.position.x = 2.1;
  group.add(flangeR);

  // Bonnet Neck
  const bonnetGeo = new THREE.CylinderGeometry(0.6, 0.7, 1.1, 24);
  const bonnet = new THREE.Mesh(bonnetGeo, ironMat);
  bonnet.position.y = 1.1;
  group.add(bonnet);

  // 2. Yoke Legs
  const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 12);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });

  const leg1 = new THREE.Mesh(legGeo, legMat);
  leg1.position.set(-0.55, 2.2, 0);
  group.add(leg1);

  const leg2 = new THREE.Mesh(legGeo, legMat);
  leg2.position.set(0.55, 2.2, 0);
  group.add(leg2);

  // Travel Indicator Scale plate
  const scaleGeo = new THREE.BoxGeometry(0.35, 1.2, 0.05);
  const scaleMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const scalePlate = new THREE.Mesh(scaleGeo, scaleMat);
  scalePlate.position.set(0, 2.2, 0.25);
  group.add(scalePlate);

  // 3. Diaphragm Actuator Casing (Green/Industrial Top)
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x059669, // Actuator green
    metalness: 0.4,
    roughness: 0.4
  });

  const domeGeoTop = new THREE.CylinderGeometry(1.6, 1.8, 0.5, 32);
  const domeTop = new THREE.Mesh(domeGeoTop, domeMat);
  domeTop.position.y = 3.2;
  group.add(domeTop);

  const domeGeoBottom = new THREE.CylinderGeometry(1.8, 1.6, 0.4, 32);
  const domeBottom = new THREE.Mesh(domeGeoBottom, domeMat);
  domeBottom.position.y = 2.85;
  group.add(domeBottom);

  // Pneumatic Air Supply Connection (3-15 psi)
  const portGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12);
  const port = new THREE.Mesh(portGeo, legMat);
  port.rotation.z = Math.PI / 2;
  port.position.set(1.9, 3.2, 0);
  group.add(port);

  // 4. Moving Valve Stem (High polish chrome)
  const stemGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.6, 16);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.95,
    roughness: 0.1
  });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 1.0;
  group.add(stem);
  stemRef.current = stem;

  // Travel Pointer attached to stem
  const pointerGeo = new THREE.BoxGeometry(0.5, 0.06, 0.1);
  const pointerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const pointer = new THREE.Mesh(pointerGeo, pointerMat);
  pointer.position.y = 1.0;
  stem.add(pointer);

  // Contoured Valve Plug (Internal trim)
  const plugGeo = new THREE.ConeGeometry(0.5, 0.8, 24);
  const plugMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
  const plug = new THREE.Mesh(plugGeo, plugMat);
  plug.rotation.x = Math.PI; // pointing down
  plug.position.y = -0.3;
  group.add(plug);
  plugRef.current = plug;
}

function buildPHTank(
  group: THREE.Group,
  liquidRef: React.MutableRefObject<THREE.Mesh | null>,
  stirrerRef: React.MutableRefObject<THREE.Group | null>,
  bubblesRef: React.MutableRefObject<THREE.Group | null>
) {
  // Transparent Neutralization Reactor Tank
  const tankGeo = new THREE.CylinderGeometry(1.8, 1.8, 3.4, 32, 1, true);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.8,
    side: THREE.DoubleSide
  });
  const tank = new THREE.Mesh(tankGeo, glassMat);
  group.add(tank);

  // Tank Bottom Dished Head
  const botGeo = new THREE.SphereGeometry(1.8, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const botMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const tankBottom = new THREE.Mesh(botGeo, botMat);
  tankBottom.position.y = -1.7;
  group.add(tankBottom);

  // Tank Top Cover
  const topCoverGeo = new THREE.CylinderGeometry(1.85, 1.85, 0.2, 32);
  const topCover = new THREE.Mesh(topCoverGeo, botMat);
  topCover.position.y = 1.7;
  group.add(topCover);

  // Reagent Dosing Pipe (Acid / Base Injection)
  const reagentPipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 16);
  const reagentPipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
  const reagentPipe = new THREE.Mesh(reagentPipeGeo, reagentPipeMat);
  reagentPipe.position.set(-0.8, 1.2, 0);
  group.add(reagentPipe);

  // pH Sensor Probe (Glass electrode dip tube)
  const probeGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 16);
  const probeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4 });
  const probe = new THREE.Mesh(probeGeo, probeMat);
  probe.position.set(0.8, 0.6, 0);
  group.add(probe);

  // pH Sensor Bulb
  const bulbGeo = new THREE.SphereGeometry(0.14, 16, 16);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = -1.4;
  probe.add(bulb);

  // Internal Liquid Volume
  const liquidGeo = new THREE.CylinderGeometry(1.72, 1.72, 2.6, 32);
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.85,
    roughness: 0.2
  });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.y = -0.4;
  group.add(liquid);
  liquidRef.current = liquid;

  // Mechanical Agitator / Stirrer Motor
  const motorGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 20);
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
  const motor = new THREE.Mesh(motorGeo, motorMat);
  motor.position.y = 2.2;
  group.add(motor);

  // Stirrer Shaft & Impeller Group
  const stirrerGroup = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 12);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = 0.2;
  stirrerGroup.add(shaft);

  // Impeller Blades
  const bladeGeo = new THREE.BoxGeometry(0.8, 0.2, 0.04);
  const blade1 = new THREE.Mesh(bladeGeo, shaftMat);
  blade1.position.y = -1.2;
  stirrerGroup.add(blade1);

  const blade2 = new THREE.Mesh(bladeGeo, shaftMat);
  blade2.rotation.y = Math.PI / 2;
  blade2.position.y = -1.2;
  stirrerGroup.add(blade2);

  group.add(stirrerGroup);
  stirrerRef.current = stirrerGroup;

  // Reactant micro-droplets
  const bubbleGroup = new THREE.Group();
  const dropGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 25; i++) {
    const d = new THREE.Mesh(dropGeo, dropMat);
    d.position.set((Math.random() - 0.5) * 2.8, -1.4 + Math.random() * 2.0, (Math.random() - 0.5) * 2.8);
    d.userData = { speed: 0.5 + Math.random() * 0.8 };
    bubbleGroup.add(d);
  }
  group.add(bubbleGroup);
  bubblesRef.current = bubbleGroup;
}
