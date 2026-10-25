import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Eye,
  Maximize2,
  HelpCircle,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Topic, CellularCompartmentInfo } from '../types';

interface CellOrganelle3DViewerProps {
  topic: Topic;
  darkMode: boolean;
  onSelectCompartment?: (compartment: CellularCompartmentInfo) => void;
  onAskTutor?: (question: string) => void;
}

// Module-scope reusable math vectors for zero GC
const _vec3 = new THREE.Vector3();

export const CellOrganelle3DViewer: React.FC<CellOrganelle3DViewerProps> = ({
  topic,
  darkMode,
  onSelectCompartment,
  onAskTutor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeoutRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Dynamic animation object handles
  const impulseMeshRef = useRef<THREE.Mesh | null>(null);
  const atpRotorsRef = useRef<THREE.Group[]>([]);
  const protonParticlesRef = useRef<THREE.Points | null>(null);
  const sarcomereHeadsRef = useRef<THREE.Group[]>([]);
  const cytosolParticlesRef = useRef<THREE.Points | null>(null);
  const cellMitoMeshesRef = useRef<THREE.Mesh[]>([]);

  // Interactive UI state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [cutawayDepth, setCutawayDepth] = useState<number>(45); // 0% to 100%
  const [explodeSpacing, setExplodeSpacing] = useState<number>(0); // 0 to 100
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [activeCamPreset, setActiveCamPreset] = useState<'iso' | 'cutaway' | 'focus'>('iso');
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [impulseActive, setImpulseActive] = useState<boolean>(false);

  // References to cutaway/movable groups
  const outerEnvelopeGroupRef = useRef<THREE.Group | null>(null);
  const innerStructuresGroupRef = useRef<THREE.Group | null>(null);
  const interactivePartsMapRef = useRef<Map<THREE.Object3D, string>>(new Map());

  const isNeuron = topic.id === 'neuron-cell' || topic.structureType === 'neuron';
  const isMitochondria = topic.id === 'mitochondria-organelle' || topic.structureType === 'mitochondria';
  const isSarcomere = topic.id === 'sarcomere-tissue' || topic.structureType === 'tissue';
  const isCellularStructure =
    topic.id === 'cellular-structure' ||
    topic.structureType === 'cell_organelle' ||
    (!isNeuron && !isMitochondria && !isSarcomere);

  // Find currently selected compartment object
  const activeCompartment = topic.cellularCompartments?.find((c) => c.id === selectedPartId) || null;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL per Three.js skill directive
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Camera Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const bgColor = darkMode ? 0x090d16 : 0xf1f5f9;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.015);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 8, 22);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = darkMode ? 1.25 : 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 50;
    controls.minDistance = 4;
    controls.target.set(0, 0, 0);

    // 4. Studio 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(12, 18, 14);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(
      darkMode ? 0x6366f1 : 0xdbeafe,
      darkMode ? 0x0f172a : 0x94a3b8,
      1.2
    );
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-14, -6, -12);
    scene.add(rimLight);

    // Soft grounded contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(32, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: darkMode ? 0.35 : 0.15,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -4.5;
    scene.add(shadowPlane);

    // Reset collections
    atpRotorsRef.current = [];
    sarcomereHeadsRef.current = [];
    interactivePartsMapRef.current.clear();

    const outerGroup = new THREE.Group();
    const innerGroup = new THREE.Group();
    outerEnvelopeGroupRef.current = outerGroup;
    innerStructuresGroupRef.current = innerGroup;
    scene.add(outerGroup);
    scene.add(innerGroup);

    // -------------------------------------------------------------
    // PROCEDURAL MODEL GENERATION (Composite 3-12 part groups)
    // -------------------------------------------------------------
    if (isNeuron) {
      // -------------------------------------------------------------
      // NEURON: Soma, Nucleus, Dendrites, Axon Hillock, Myelinated Axon, Nodes, Boutons
      // -------------------------------------------------------------
      // 1. Soma (Cell Body) - Organic displaced sphere
      const somaGeo = new THREE.IcosahedronGeometry(2.8, 3);
      // Add subtle organic distortion
      const pos = somaGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        _vec3.fromBufferAttribute(pos, i);
        const noise = Math.sin(_vec3.x * 2.5) * Math.cos(_vec3.y * 2.5) * 0.18;
        _vec3.addScaledVector(_vec3.clone().normalize(), noise);
        pos.setXYZ(i, _vec3.x, _vec3.y, _vec3.z);
      }
      somaGeo.computeVertexNormals();

      const somaMat = new THREE.MeshPhysicalMaterial({
        color: 0x6366f1,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.3,
        transparent: true,
        opacity: 0.92,
      });
      const somaMesh = new THREE.Mesh(somaGeo, somaMat);
      somaMesh.position.set(-8, 0, 0);
      somaMesh.name = 'soma';
      outerGroup.add(somaMesh);
      interactivePartsMapRef.current.set(somaMesh, 'soma');

      // Nucleus inside soma
      const nucGeo = new THREE.SphereGeometry(1.2, 24, 24);
      const nucMat = new THREE.MeshPhysicalMaterial({
        color: 0xa855f7,
        roughness: 0.25,
        metalness: 0.2,
        emissive: 0x581c87,
        emissiveIntensity: 0.3,
      });
      const nucMesh = new THREE.Mesh(nucGeo, nucMat);
      nucMesh.position.set(-8, 0.2, 0);
      nucMesh.name = 'nucleus';
      innerGroup.add(nucMesh);
      interactivePartsMapRef.current.set(nucMesh, 'nucleus');

      // Nucleolus core
      const nucleolusGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const nucleolusMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
      nucleolus.position.set(-8.2, 0.4, 0.2);
      innerGroup.add(nucleolus);

      // Dendrite Branches radiating from Soma
      const dendriteAngles = [
        { angle: Math.PI * 0.55, len: 4.5, curve: 0.6 },
        { angle: Math.PI * 0.75, len: 5.2, curve: -0.8 },
        { angle: Math.PI * 0.95, len: 4.8, curve: 0.5 },
        { angle: Math.PI * 1.15, len: 5.0, curve: -0.4 },
        { angle: Math.PI * 1.35, len: 4.2, curve: 0.7 },
      ];

      dendriteAngles.forEach((d, idx) => {
        const curvePoints: THREE.Vector3[] = [];
        const start = new THREE.Vector3(-8, 0, 0);
        const segments = 6;
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const rad = 2.4 + t * d.len;
          const a = d.angle + Math.sin(t * Math.PI) * d.curve * 0.3;
          curvePoints.push(
            new THREE.Vector3(
              -8 + Math.cos(a) * rad,
              Math.sin(a) * rad,
              Math.sin(t * 3) * 0.5
            )
          );
        }
        const spline = new THREE.CatmullRomCurve3(curvePoints);
        const tubeGeo = new THREE.TubeGeometry(spline, 24, 0.28, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0x818cf8,
          roughness: 0.4,
        });
        const dendriteTube = new THREE.Mesh(tubeGeo, tubeMat);
        dendriteTube.name = 'dendrites';
        outerGroup.add(dendriteTube);
        interactivePartsMapRef.current.set(dendriteTube, 'dendrites');

        // Dendritic spine micro-studs
        for (let sp = 1; sp < curvePoints.length - 1; sp++) {
          const spineGeo = new THREE.SphereGeometry(0.16, 8, 8);
          const spineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const spine = new THREE.Mesh(spineGeo, spineMat);
          spine.position.copy(curvePoints[sp]).add(new THREE.Vector3(0.2, 0.2, 0));
          outerGroup.add(spine);
        }
      });

      // Axon Hillock (Trigger funnel)
      const hillockGeo = new THREE.ConeGeometry(1.6, 2.5, 24, 1, true);
      hillockGeo.rotateZ(-Math.PI / 2);
      const hillockMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        roughness: 0.3,
        metalness: 0.2,
        clearcoat: 0.4,
      });
      const hillock = new THREE.Mesh(hillockGeo, hillockMat);
      hillock.position.set(-5.5, 0, 0);
      hillock.name = 'axon-hillock';
      outerGroup.add(hillock);
      interactivePartsMapRef.current.set(hillock, 'axon-hillock');

      // Long Axon Shaft Core
      const axonCoreGeo = new THREE.CylinderGeometry(0.26, 0.26, 17, 16);
      axonCoreGeo.rotateZ(Math.PI / 2);
      const axonCoreMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      });
      const axonCore = new THREE.Mesh(axonCoreGeo, axonCoreMat);
      axonCore.position.set(3.5, 0, 0);
      axonCore.name = 'axon';
      innerGroup.add(axonCore);
      interactivePartsMapRef.current.set(axonCore, 'axon');

      // Segmented Myelin Sheath wraps & Nodes of Ranvier gaps
      const myelinSegments = 5;
      const segWidth = 2.4;
      const gap = 0.6;
      for (let m = 0; m < myelinSegments; m++) {
        const posX = -3.2 + m * (segWidth + gap);

        // Schwann cell / Myelin wrap cylinder
        const myelinGeo = new THREE.CylinderGeometry(0.85, 0.85, segWidth, 24);
        myelinGeo.rotateZ(Math.PI / 2);
        const myelinMat = new THREE.MeshPhysicalMaterial({
          color: 0x10b981,
          roughness: 0.2,
          metalness: 0.1,
          clearcoat: 0.6,
          transparent: true,
          opacity: 0.88,
        });
        const myelin = new THREE.Mesh(myelinGeo, myelinMat);
        myelin.position.set(posX, 0, 0);
        myelin.name = 'myelin-sheath';
        outerGroup.add(myelin);
        interactivePartsMapRef.current.set(myelin, 'myelin-sheath');

        // Schwann cell nucleus bump on sheath
        const schGeo = new THREE.SphereGeometry(0.28, 12, 12);
        schGeo.scale(1.8, 0.8, 1);
        const schMat = new THREE.MeshStandardMaterial({ color: 0x059669 });
        const schNuc = new THREE.Mesh(schGeo, schMat);
        schNuc.position.set(posX, 0.82, 0);
        outerGroup.add(schNuc);

        // Node of Ranvier exposed channel collar in the gap
        if (m < myelinSegments - 1) {
          const nodeCollarGeo = new THREE.TorusGeometry(0.38, 0.08, 12, 24);
          nodeCollarGeo.rotateY(Math.PI / 2);
          const nodeCollarMat = new THREE.MeshStandardMaterial({
            color: 0xec4899,
            emissive: 0xbe185d,
            emissiveIntensity: 0.5,
          });
          const nodeCollar = new THREE.Mesh(nodeCollarGeo, nodeCollarMat);
          nodeCollar.position.set(posX + segWidth / 2 + gap / 2, 0, 0);
          nodeCollar.name = 'nodes-ranvier';
          innerGroup.add(nodeCollar);
          interactivePartsMapRef.current.set(nodeCollar, 'nodes-ranvier');
        }
      }

      // Synaptic Terminal Boutons (Arborization at distal end)
      const terminalRootX = 12;
      const terminalBranches = [
        { y: 1.8, z: 1.2 },
        { y: 0.2, z: -1.6 },
        { y: -1.5, z: 1.0 },
      ];

      terminalBranches.forEach((tb) => {
        const branchSpline = new THREE.CatmullRomCurve3([
          new THREE.Vector3(10.5, 0, 0),
          new THREE.Vector3(terminalRootX, tb.y * 0.6, tb.z * 0.6),
          new THREE.Vector3(terminalRootX + 1.8, tb.y, tb.z),
        ]);
        const bGeo = new THREE.TubeGeometry(branchSpline, 16, 0.16, 8, false);
        const bMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        outerGroup.add(bMesh);

        // Synaptic Bouton knob bulb
        const boutonGeo = new THREE.SphereGeometry(0.55, 18, 18);
        const boutonMat = new THREE.MeshPhysicalMaterial({
          color: 0xef4444,
          roughness: 0.3,
          metalness: 0.2,
          emissive: 0x991b1b,
          emissiveIntensity: 0.4,
        });
        const bouton = new THREE.Mesh(boutonGeo, boutonMat);
        bouton.position.set(terminalRootX + 1.8, tb.y, tb.z);
        bouton.name = 'synapse-terminal';
        outerGroup.add(bouton);
        interactivePartsMapRef.current.set(bouton, 'synapse-terminal');

        // Microtransmitter synaptic vesicles inside bouton
        for (let v = 0; v < 4; v++) {
          const vesGeo = new THREE.SphereGeometry(0.09, 8, 8);
          const vesMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
          const ves = new THREE.Mesh(vesGeo, vesMat);
          ves.position.set(
            terminalRootX + 1.8 + (Math.random() - 0.5) * 0.4,
            tb.y + (Math.random() - 0.5) * 0.4,
            tb.z + (Math.random() - 0.5) * 0.4
          );
          innerGroup.add(ves);
        }
      });

      // Action Potential Traveling Pulse Mesh
      const pulseGeo = new THREE.SphereGeometry(0.65, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.position.set(-6, 0, 0);
      scene.add(pulseMesh);
      impulseMeshRef.current = pulseMesh;
    } else if (isMitochondria) {
      // -------------------------------------------------------------
      // MITOCHONDRION: Outer Membrane (cutaway), IMS, Inner Folded Cristae, Matrix, ATP Synthase
      // -------------------------------------------------------------
      // 1. Outer Membrane Capsule (Ellipsoid shell)
      const outerGeo = new THREE.CapsuleGeometry(3.6, 9.5, 32, 64);
      outerGeo.rotateZ(Math.PI / 2);
      const outerMat = new THREE.MeshPhysicalMaterial({
        color: 0xf97316,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.5,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.name = 'outer-membrane';
      outerGroup.add(outerMesh);
      interactivePartsMapRef.current.set(outerMesh, 'outer-membrane');

      // VDAC Porin channel rings studded on outer membrane
      for (let p = 0; p < 14; p++) {
        const porinGeo = new THREE.TorusGeometry(0.24, 0.07, 8, 16);
        const porinMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.3,
        });
        const porin = new THREE.Mesh(porinGeo, porinMat);
        const ang = Math.random() * Math.PI * 2;
        const xPos = (Math.random() - 0.5) * 9;
        porin.position.set(xPos, Math.cos(ang) * 3.6, Math.sin(ang) * 3.6);
        porin.lookAt(xPos, 0, 0);
        outerGroup.add(porin);
      }

      // 2. Matrix Volume (Inner gel compartment)
      const matrixGeo = new THREE.CapsuleGeometry(2.9, 8.2, 24, 48);
      matrixGeo.rotateZ(Math.PI / 2);
      const matrixMat = new THREE.MeshPhysicalMaterial({
        color: 0xd97706,
        roughness: 0.5,
        metalness: 0.05,
        transparent: true,
        opacity: 0.75,
      });
      const matrixMesh = new THREE.Mesh(matrixGeo, matrixMat);
      matrixMesh.name = 'matrix';
      innerGroup.add(matrixMesh);
      interactivePartsMapRef.current.set(matrixMesh, 'matrix');

      // 3. Folded Cristae Sheets (Invaginated Shelves with high surface area)
      const numCristae = 8;
      for (let c = 0; c < numCristae; c++) {
        const posX = -4.2 + c * 1.2;
        // Baffled crista fold geometry
        const cristaGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.28, 32);
        cristaGeo.rotateZ(Math.PI / 2);
        cristaGeo.scale(1, 1, 0.65);
        const cristaMat = new THREE.MeshPhysicalMaterial({
          color: 0xef4444,
          roughness: 0.3,
          metalness: 0.15,
          clearcoat: 0.3,
        });
        const cristaMesh = new THREE.Mesh(cristaGeo, cristaMat);
        cristaMesh.position.set(posX, Math.sin(c) * 0.3, 0);
        cristaMesh.name = 'cristae-folds';
        innerGroup.add(cristaMesh);
        interactivePartsMapRef.current.set(cristaMesh, 'cristae-folds');

        // Stud F0F1 ATP Synthase rotary complexes on crista ridge
        const atpGroup = new THREE.Group();
        atpGroup.position.set(posX, 2.35, 0);

        // F0 base stalk
        const stalkGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
        const stalkMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
        const stalk = new THREE.Mesh(stalkGeo, stalkMat);
        stalk.position.y = 0.25;
        atpGroup.add(stalk);

        // F1 rotary head
        const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
        headGeo.scale(1.2, 0.8, 1.2);
        const headMat = new THREE.MeshPhysicalMaterial({
          color: 0x22c55e,
          emissive: 0x15803d,
          emissiveIntensity: 0.5,
          roughness: 0.2,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.6;
        atpGroup.add(head);

        atpGroup.name = 'atp-synthase';
        innerGroup.add(atpGroup);
        atpRotorsRef.current.push(atpGroup);
        interactivePartsMapRef.current.set(head, 'atp-synthase');
      }

      // 4. Circular mtDNA (Mitochondrial DNA plasmid loop)
      const dnaCurve = new THREE.TorusGeometry(1.2, 0.07, 12, 48);
      const dnaMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const dnaMesh = new THREE.Mesh(dnaCurve, dnaMat);
      dnaMesh.position.set(1.5, -0.6, 0.5);
      dnaMesh.rotation.x = Math.PI / 3;
      dnaMesh.name = 'mtdna';
      innerGroup.add(dnaMesh);
      interactivePartsMapRef.current.set(dnaMesh, 'mtdna');

      // 5. Mitoribosomes (Granules in matrix)
      for (let r = 0; r < 25; r++) {
        const riboGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const riboMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const ribo = new THREE.Mesh(riboGeo, riboMat);
        ribo.position.set(
          (Math.random() - 0.5) * 7.5,
          (Math.random() - 0.5) * 3.8,
          (Math.random() - 0.5) * 3.8
        );
        innerGroup.add(ribo);
      }

      // 6. Streaming Proton H+ Particle Field
      const protonCount = 120;
      const protonGeo = new THREE.BufferGeometry();
      const protonPos = new Float32Array(protonCount * 3);
      for (let i = 0; i < protonCount; i++) {
        protonPos[i * 3] = (Math.random() - 0.5) * 9;
        protonPos[i * 3 + 1] = 2.4 + Math.random() * 0.9;
        protonPos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
      }
      protonGeo.setAttribute('position', new THREE.BufferAttribute(protonPos, 3));
      const protonMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.16,
        transparent: true,
        opacity: 0.85,
      });
      const protons = new THREE.Points(protonGeo, protonMat);
      scene.add(protons);
      protonParticlesRef.current = protons;
    } else if (isCellularStructure) {
      // -------------------------------------------------------------
      // EUKARYOTIC / ANIMAL CELLULAR STRUCTURE:
      // Plasma Membrane (Cutaway), Nucleus, Nucleolus, Rough & Smooth ER,
      // Golgi Apparatus, Mitochondria, Lysosomes, Centrosome & Cytosol
      // -------------------------------------------------------------
      cellMitoMeshesRef.current = [];

      // 1. Plasma Membrane (Translucent 3/4 Cutaway Spherical Shell)
      // Open 90° wedge (0 to 1.55 * PI) reveals the inner cellular metropolis
      const membraneGeo = new THREE.SphereGeometry(6.6, 48, 48, 0, Math.PI * 1.55, 0, Math.PI);
      const membraneMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.25,
        metalness: 0.1,
        clearcoat: 0.7,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const membraneMesh = new THREE.Mesh(membraneGeo, membraneMat);
      membraneMesh.name = 'plasma-membrane';
      outerGroup.add(membraneMesh);
      interactivePartsMapRef.current.set(membraneMesh, 'plasma-membrane');

      // Surface Glycoprotein and Ion Channel Receptors on outer membrane
      for (let s = 0; s < 22; s++) {
        const theta = 0.2 + (s / 22) * (Math.PI * 1.4);
        const phi = 0.3 + (Math.random() * 0.7) * Math.PI;
        const rad = 6.65;
        const receptorGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.6, 8);
        const receptorMat = new THREE.MeshStandardMaterial({
          color: s % 2 === 0 ? 0x10b981 : 0xa855f7,
          roughness: 0.4,
        });
        const receptor = new THREE.Mesh(receptorGeo, receptorMat);
        receptor.position.set(
          rad * Math.sin(phi) * Math.cos(theta),
          rad * Math.cos(phi),
          rad * Math.sin(phi) * Math.sin(theta)
        );
        receptor.lookAt(0, 0, 0);
        outerGroup.add(receptor);
      }

      // 2. Nucleus & Nuclear Envelope (Cutaway Sphere at center)
      const nucGeo = new THREE.SphereGeometry(2.35, 36, 36, 0, Math.PI * 1.6, 0, Math.PI);
      const nucMat = new THREE.MeshPhysicalMaterial({
        color: 0x8b5cf6,
        roughness: 0.35,
        metalness: 0.15,
        clearcoat: 0.4,
        side: THREE.DoubleSide,
      });
      const nucMesh = new THREE.Mesh(nucGeo, nucMat);
      nucMesh.name = 'nucleus';
      innerGroup.add(nucMesh);
      interactivePartsMapRef.current.set(nucMesh, 'nucleus');

      // Studded Nuclear Pore Complexes (Toruses on nuclear envelope)
      for (let p = 0; p < 18; p++) {
        const poreGeo = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
        const poreMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.3 });
        const pore = new THREE.Mesh(poreGeo, poreMat);
        const pTheta = 0.15 + (p / 18) * (Math.PI * 1.45);
        const pPhi = 0.3 + (Math.random() * 0.6) * Math.PI;
        pore.position.set(
          2.36 * Math.sin(pPhi) * Math.cos(pTheta),
          2.36 * Math.cos(pPhi),
          2.36 * Math.sin(pPhi) * Math.sin(pTheta)
        );
        pore.lookAt(0, 0, 0);
        innerGroup.add(pore);
      }

      // 3. Nucleolus (Dense Inner rRNA Forge)
      const nucleolusGeo = new THREE.SphereGeometry(0.9, 24, 24);
      const nucleolusMat = new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.5,
        roughness: 0.25,
      });
      const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
      nucleolus.position.set(0.2, 0.2, 0.2);
      nucleolus.name = 'nucleolus';
      innerGroup.add(nucleolus);
      interactivePartsMapRef.current.set(nucleolus, 'nucleolus');

      // 4. Endoplasmic Reticulum (Concentric Undulating Ribbon Folds around Nucleus)
      for (let r = 0; r < 3; r++) {
        const erRadius = 2.9 + r * 0.55;
        const erGeo = new THREE.TorusGeometry(erRadius, 0.22, 12, 40, Math.PI * 1.35);
        erGeo.rotateX(Math.PI / 2 + r * 0.22);
        erGeo.rotateZ(r * 0.4);
        const erMat = new THREE.MeshPhysicalMaterial({
          color: 0xec4899,
          roughness: 0.35,
          metalness: 0.1,
          clearcoat: 0.35,
        });
        const erMesh = new THREE.Mesh(erGeo, erMat);
        erMesh.position.set(0, -0.25 + r * 0.3, 0);
        erMesh.name = 'endoplasmic-reticulum';
        innerGroup.add(erMesh);
        interactivePartsMapRef.current.set(erMesh, 'endoplasmic-reticulum');

        // Studded 80S Ribosome Granules (Rough ER)
        for (let b = 0; b < 14; b++) {
          const riboGeo = new THREE.SphereGeometry(0.065, 6, 6);
          const riboMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
          const ribo = new THREE.Mesh(riboGeo, riboMat);
          const angle = (b / 14) * Math.PI * 1.35;
          ribo.position.set(
            Math.cos(angle) * erRadius + (Math.random() - 0.5) * 0.15,
            -0.25 + r * 0.3 + (Math.random() - 0.5) * 0.2,
            Math.sin(angle) * erRadius + (Math.random() - 0.5) * 0.15
          );
          innerGroup.add(ribo);
        }
      }

      // 5. Golgi Apparatus (Stacked Curved Cisternae with Budding Vesicles)
      const golgiGroup = new THREE.Group();
      golgiGroup.position.set(3.3, 0.7, -1.1);
      for (let g = 0; g < 4; g++) {
        const cisternGeo = new THREE.TorusGeometry(1.4 - g * 0.12, 0.18, 10, 28, Math.PI * 0.85);
        cisternGeo.rotateZ(Math.PI * 0.25);
        cisternGeo.rotateX(Math.PI * 0.3);
        const cisternMat = new THREE.MeshPhysicalMaterial({
          color: 0xf59e0b,
          roughness: 0.3,
          metalness: 0.15,
          clearcoat: 0.4,
        });
        const cistern = new THREE.Mesh(cisternGeo, cisternMat);
        cistern.position.set(g * 0.32, g * 0.18, -g * 0.25);
        golgiGroup.add(cistern);
      }
      // Budding secretory vesicles from Golgi
      for (let v = 0; v < 6; v++) {
        const vGeo = new THREE.SphereGeometry(0.13, 8, 8);
        const vMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3 });
        const ves = new THREE.Mesh(vGeo, vMat);
        ves.position.set(
          1.1 + (Math.random() - 0.5) * 0.9,
          (Math.random() - 0.5) * 0.9,
          (Math.random() - 0.5) * 0.9
        );
        golgiGroup.add(ves);
      }
      golgiGroup.name = 'golgi-apparatus';
      innerGroup.add(golgiGroup);
      interactivePartsMapRef.current.set(golgiGroup, 'golgi-apparatus');

      // 6. Mitochondria (Mini Powerhouse Capsules in Cytosol)
      const mitoPositions = [
        { pos: new THREE.Vector3(-3.2, 1.8, 1.2), rot: new THREE.Vector3(0.4, 0.6, 0.2) },
        { pos: new THREE.Vector3(2.8, -2.2, 1.5), rot: new THREE.Vector3(-0.3, 0.8, 0.4) },
        { pos: new THREE.Vector3(-2.6, -2.5, -1.4), rot: new THREE.Vector3(0.8, -0.4, 0.3) },
        { pos: new THREE.Vector3(3.0, 2.6, -0.8), rot: new THREE.Vector3(-0.5, 0.2, 0.7) },
      ];

      mitoPositions.forEach((mConf, idx) => {
        const miniMitoGroup = new THREE.Group();
        miniMitoGroup.position.copy(mConf.pos);
        miniMitoGroup.rotation.set(mConf.rot.x, mConf.rot.y, mConf.rot.z);

        const mitoGeo = new THREE.CapsuleGeometry(0.44, 1.2, 16, 16);
        mitoGeo.rotateZ(Math.PI / 2);
        const mitoMat = new THREE.MeshPhysicalMaterial({
          color: 0xf97316,
          roughness: 0.35,
          metalness: 0.1,
          clearcoat: 0.4,
          emissive: 0xc2410c,
          emissiveIntensity: 0.25,
        });
        const mitoMesh = new THREE.Mesh(mitoGeo, mitoMat);
        mitoMesh.name = 'mitochondria';
        miniMitoGroup.add(mitoMesh);

        // Subtle internal crista shelf
        const ridgeGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.8, 12);
        ridgeGeo.rotateZ(Math.PI / 2);
        const ridgeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        miniMitoGroup.add(ridge);

        innerGroup.add(miniMitoGroup);
        cellMitoMeshesRef.current.push(mitoMesh);
        interactivePartsMapRef.current.set(mitoMesh, 'mitochondria');
      });

      // 7. Lysosomes & Peroxisomes (Digestive Enzyme Vesicles)
      const lysoPositions = [
        new THREE.Vector3(1.6, 3.2, 1.0),
        new THREE.Vector3(-3.5, 0.3, 2.5),
        new THREE.Vector3(2.1, -3.2, -1.0),
        new THREE.Vector3(-1.8, 2.9, -2.2),
        new THREE.Vector3(0.9, -3.6, 1.8),
      ];

      lysoPositions.forEach((lPos) => {
        const lysoGeo = new THREE.SphereGeometry(0.38, 16, 16);
        const lysoMat = new THREE.MeshPhysicalMaterial({
          color: 0x10b981,
          roughness: 0.25,
          metalness: 0.1,
          clearcoat: 0.5,
          emissive: 0x047857,
          emissiveIntensity: 0.25,
        });
        const lysoMesh = new THREE.Mesh(lysoGeo, lysoMat);
        lysoMesh.position.copy(lPos);
        lysoMesh.name = 'lysosomes';
        innerGroup.add(lysoMesh);
        interactivePartsMapRef.current.set(lysoMesh, 'lysosomes');
      });

      // 8. Centrosome (Pair of Orthogonal Centrioles with Microtubule Asters)
      const centroGroup = new THREE.Group();
      centroGroup.position.set(-1.6, 2.3, 0.5);
      const centrioleGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12);
      const centrioleMat = new THREE.MeshPhysicalMaterial({
        color: 0x6366f1,
        roughness: 0.3,
        metalness: 0.2,
      });

      const cent1 = new THREE.Mesh(centrioleGeo, centrioleMat);
      cent1.position.set(0, 0, 0);
      centroGroup.add(cent1);

      const cent2 = new THREE.Mesh(centrioleGeo, centrioleMat);
      cent2.position.set(0.3, 0, 0);
      cent2.rotateZ(Math.PI / 2);
      centroGroup.add(cent2);

      // Microtubule rays radiating outward
      for (let mt = 0; mt < 6; mt++) {
        const mtAng = (mt / 6) * Math.PI * 2;
        const mtGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6);
        const mtMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });
        const mtMesh = new THREE.Mesh(mtGeo, mtMat);
        mtMesh.position.set(Math.cos(mtAng) * 0.9, Math.sin(mtAng) * 0.9, 0);
        mtMesh.rotation.z = mtAng + Math.PI / 2;
        centroGroup.add(mtMesh);
      }

      centroGroup.name = 'centrosome';
      innerGroup.add(centroGroup);
      interactivePartsMapRef.current.set(cent1, 'centrosome');

      // 9. Streaming Cytoplasmic Vesicle Particle Field (Cytosol)
      const cytosolCount = 130;
      const cytosolGeo = new THREE.BufferGeometry();
      const cytosolPositions = new Float32Array(cytosolCount * 3);
      for (let i = 0; i < cytosolCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 2.4 + Math.cbrt(Math.random()) * 3.8;
        cytosolPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        cytosolPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        cytosolPositions[i * 3 + 2] = r * Math.cos(phi);
      }
      cytosolGeo.setAttribute('position', new THREE.BufferAttribute(cytosolPositions, 3));
      const cytosolMat = new THREE.PointsMaterial({
        color: 0x06b6d4,
        size: 0.16,
        transparent: true,
        opacity: 0.85,
      });
      const cytosolPoints = new THREE.Points(cytosolGeo, cytosolMat);
      cytosolPoints.name = 'cytosol';
      scene.add(cytosolPoints);
      cytosolParticlesRef.current = cytosolPoints;
    } else {
      // -------------------------------------------------------------
      // SARCOMERE / MUSCLE TISSUE: Z-Discs, Actin thin filaments, Myosin thick filaments with heads
      // -------------------------------------------------------------
      const zDiscGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.35, 32);
      zDiscGeo.rotateZ(Math.PI / 2);
      const zDiscMat = new THREE.MeshPhysicalMaterial({
        color: 0xec4899,
        roughness: 0.3,
        metalness: 0.2,
      });

      // Left Z-disc
      const zDiscLeft = new THREE.Mesh(zDiscGeo, zDiscMat);
      zDiscLeft.position.set(-6, 0, 0);
      zDiscLeft.name = 'z-disc';
      outerGroup.add(zDiscLeft);
      interactivePartsMapRef.current.set(zDiscLeft, 'z-disc');

      // Right Z-disc
      const zDiscRight = new THREE.Mesh(zDiscGeo, zDiscMat);
      zDiscRight.position.set(6, 0, 0);
      zDiscRight.name = 'z-disc';
      outerGroup.add(zDiscRight);
      interactivePartsMapRef.current.set(zDiscRight, 'z-disc');

      // Thick Myosin Filaments in center (A-Band)
      for (let y = -2; y <= 2; y += 1.3) {
        const thickGeo = new THREE.CylinderGeometry(0.32, 0.32, 7.5, 16);
        thickGeo.rotateZ(Math.PI / 2);
        const thickMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          roughness: 0.4,
        });
        const thick = new THREE.Mesh(thickGeo, thickMat);
        thick.position.set(0, y, 0);
        thick.name = 'myosin';
        innerGroup.add(thick);
        interactivePartsMapRef.current.set(thick, 'myosin');

        // Pivoting Cross-bridge heads on Myosin
        for (let h = -3; h <= 3; h += 0.8) {
          if (Math.abs(h) < 0.5) continue; // M-line bare zone
          const headGroup = new THREE.Group();
          headGroup.position.set(h, y + (h > 0 ? 0.35 : -0.35), 0);
          const hGeo = new THREE.SphereGeometry(0.18, 8, 8);
          hGeo.scale(1.8, 1, 1);
          const hMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
          const hMesh = new THREE.Mesh(hGeo, hMat);
          headGroup.add(hMesh);
          innerGroup.add(headGroup);
          sarcomereHeadsRef.current.push(headGroup);
        }
      }

      // Thin Actin Filaments anchored to Z-discs
      for (let y = -1.35; y <= 1.35; y += 1.3) {
        // Left actin
        const thinGeoLeft = new THREE.CylinderGeometry(0.14, 0.14, 5.5, 12);
        thinGeoLeft.rotateZ(Math.PI / 2);
        const thinMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const thinLeft = new THREE.Mesh(thinGeoLeft, thinMat);
        thinLeft.position.set(-3.25, y, 0);
        thinLeft.name = 'actin';
        outerGroup.add(thinLeft);
        interactivePartsMapRef.current.set(thinLeft, 'actin');

        // Right actin
        const thinRight = new THREE.Mesh(thinGeoLeft, thinMat);
        thinRight.position.set(3.25, y, 0);
        thinRight.name = 'actin';
        outerGroup.add(thinRight);
        interactivePartsMapRef.current.set(thinRight, 'actin');
      }
    }

    // -------------------------------------------------------------
    // RAYCASTING FOR INTERACTIVE CLICK SELECTION
    // -------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          let cur: THREE.Object3D | null = hit.object;
          while (cur && cur !== scene) {
            const compId = interactivePartsMapRef.current.get(cur);
            if (compId) {
              setSelectedPartId(compId);
              const foundComp = topic.cellularCompartments?.find((c) => c.id === compId);
              if (foundComp && onSelectCompartment) {
                onSelectCompartment(foundComp);
              }
              return;
            }
            cur = cur.parent;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // -------------------------------------------------------------
    // ANIMATION TICK LOOP (Robust, Crash-free WebGL rendering)
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let pulseProgress = 0;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Auto-rotation for 3D depth
      if (isPlaying && sceneRef.current) {
        sceneRef.current.rotation.y += dt * 0.12 * simSpeed;
      }

      // 1. NEURON ACTION POTENTIAL PULSE
      if (impulseMeshRef.current && isNeuron) {
        if (isPlaying || impulseActive) {
          pulseProgress += dt * 2.2 * simSpeed;
          if (pulseProgress > 1) {
            pulseProgress = 0;
          }
          // Travel from axon hillock (-6) to synaptic boutons (+12)
          const posX = THREE.MathUtils.lerp(-6, 12, pulseProgress);
          impulseMeshRef.current.position.x = posX;
          const scale = 1 + Math.sin(pulseProgress * Math.PI) * 0.8;
          impulseMeshRef.current.scale.set(scale, scale, scale);
        }
      }

      // 2. MITOCHONDRIA ROTARY ATP SYNTHASE & PROTONS
      if (isMitochondria) {
        if (isPlaying) {
          atpRotorsRef.current.forEach((rotor, idx) => {
            rotor.rotation.y += dt * 8.0 * simSpeed * (idx % 2 === 0 ? 1 : -1);
          });
        }
        if (protonParticlesRef.current && isPlaying) {
          const attr = protonParticlesRef.current.geometry.attributes.position;
          const arr = attr.array as Float32Array;
          for (let i = 0; i < arr.length; i += 3) {
            // Rush down through membrane toward matrix
            arr[i + 1] -= dt * 2.5 * simSpeed;
            if (arr[i + 1] < 0.5) {
              arr[i + 1] = 3.3; // recycle back to intermembrane space
            }
          }
          attr.needsUpdate = true;
        }
      }

      // 3. EUKARYOTIC CELLULAR STRUCTURE STREAMING & PULSE
      if (isCellularStructure) {
        // Cytosol streaming vesicles orbit slowly
        if (cytosolParticlesRef.current && isPlaying) {
          cytosolParticlesRef.current.rotation.y += dt * 0.25 * simSpeed;
          cytosolParticlesRef.current.rotation.x += dt * 0.1 * simSpeed;
        }
        // Mitochondria subtle bioenergetic emissive pulse
        cellMitoMeshesRef.current.forEach((m, idx) => {
          if (m.material && (m.material as any).emissiveIntensity !== undefined) {
            (m.material as any).emissiveIntensity = 0.25 + Math.sin(time * 3 + idx) * 0.15;
          }
        });
      }

      // 4. SARCOMERE CONTRACTION CYCLE
      if (isSarcomere && isPlaying) {
        const contraction = Math.sin(time * 3 * simSpeed) * 0.8;
        if (outerEnvelopeGroupRef.current) {
          // move Z discs closer
          outerEnvelopeGroupRef.current.children.forEach((c) => {
            if (c.name === 'z-disc') {
              if (c.position.x < 0) c.position.x = -6 + contraction;
              else if (c.position.x > 0) c.position.x = 6 - contraction;
            }
          });
        }
        sarcomereHeadsRef.current.forEach((sh, idx) => {
          sh.rotation.z = Math.sin(time * 4 + idx) * 0.45;
        });
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    // Safe Resize Handler with Dimension Bounds
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const nw = Math.max(container.clientWidth || 0, 320);
      const nh = Math.max(container.clientHeight || 0, 240);
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(timeoutRef.current);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [topic.id, darkMode]);

  // Adjust cutaway depth & explode separation dynamically
  useEffect(() => {
    if (outerEnvelopeGroupRef.current) {
      // Transparency or scale displacement based on cutaway
      const opacity = 1 - (cutawayDepth / 100) * 0.7;
      outerEnvelopeGroupRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => {
              m.transparent = true;
              m.opacity = opacity;
            });
          } else {
            child.material.transparent = true;
            child.material.opacity = opacity;
          }
        }
      });
      // Explode spacing
      outerEnvelopeGroupRef.current.position.y = (explodeSpacing / 100) * 3;
    }
    if (innerStructuresGroupRef.current) {
      innerStructuresGroupRef.current.position.y = -(explodeSpacing / 100) * 2;
    }
  }, [cutawayDepth, explodeSpacing]);

  // Camera preset handler
  const setCameraPreset = (preset: 'iso' | 'cutaway' | 'focus') => {
    setActiveCamPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'iso') {
      camera.position.set(0, 8, 22);
      controls.target.set(0, 0, 0);
    } else if (preset === 'cutaway') {
      camera.position.set(0, 18, 5);
      controls.target.set(0, 0, 0);
      setCutawayDepth(75);
    } else if (preset === 'focus') {
      if (isNeuron) {
        camera.position.set(-7, 2, 8);
        controls.target.set(-7, 0, 0);
      } else if (isMitochondria) {
        camera.position.set(0, 3, 9);
        controls.target.set(0, 1, 0);
      } else if (isCellularStructure) {
        camera.position.set(0, 2, 11);
        controls.target.set(0, 0, 0);
      } else {
        camera.position.set(0, 1, 10);
        controls.target.set(0, 0, 0);
      }
    }
  };

  const triggerImpulse = () => {
    setImpulseActive(true);
    setTimeout(() => setImpulseActive(false), 2000);
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[580px] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden select-none border border-slate-200 dark:border-slate-800 shadow-inner">
      {/* Three.js Isolated Canvas Ref */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Badge & Specs (Unobtrusive) */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
          <Activity className="w-4 h-4 text-indigo-500 animate-spin-slow" />
          <span>
            {isNeuron ? '3D Multipolar Neuron Mesh' : isMitochondria ? '3D Mitochondrion Cutaway' : isCellularStructure ? '3D Eukaryotic Cell Structure' : '3D Sarcomere Engine'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
            Orbital Inspector
          </span>
        </div>

        {/* Live Biological Readings */}
        {topic.cellularMetrics && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2">
            {Object.entries(topic.cellularMetrics).slice(0, 3).map(([key, val]) => (
              <div
                key={key}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-mono border border-slate-700/80 shadow-xs backdrop-blur-xs flex items-center gap-1.5"
              >
                <span className="text-slate-400 capitalize">{key}:</span>
                <span className="text-indigo-300 font-bold">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Right Quick Simulation Trigger */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {isNeuron && (
          <button
            type="button"
            onClick={triggerImpulse}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Trigger an all-or-none action potential pulse down the axon"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Fire Action Potential</span>
          </button>
        )}

        {isMitochondria && (
          <button
            type="button"
            onClick={() => setSimSpeed((prev) => (prev >= 2 ? 1 : 2.5))}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Accelerate rotary F0F1 ATP generation"
          >
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>{simSpeed > 1 ? 'High ATP Output' : 'Boost ATP Engine'}</span>
          </button>
        )}

        {isCellularStructure && (
          <button
            type="button"
            onClick={() => setSimSpeed((prev) => (prev >= 2 ? 1 : 2.5))}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Accelerate cytoplasmic streaming & vesicle transport"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>{simSpeed > 1 ? 'High Streaming' : 'Boost Cytosol'}</span>
          </button>
        )}
      </div>

      {/* Selected Compartment Spotlight Overlay (Centered or side, minimal) */}
      {activeCompartment && (
        <div className="absolute top-16 left-4 z-10 max-w-sm p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-300 dark:border-indigo-800 shadow-xl text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeCompartment.color }}
              />
              <span className="text-sm">{activeCompartment.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPartId(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            {activeCompartment.function}
          </p>

          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Location:</span> {activeCompartment.location}
            {activeCompartment.dimensions && (
              <>
                <span className="mx-1">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Scale:</span> {activeCompartment.dimensions}
              </>
            )}
          </div>

          {onAskTutor && (
            <button
              type="button"
              onClick={() => onAskTutor(`How does the ${activeCompartment.name} work in the ${topic.title.split(':')[0]}?`)}
              className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask Sofia About {activeCompartment.name}</span>
            </button>
          )}
        </div>
      )}

      {/* THREE.JS SKILL COMPLIANT COLLAPSIBLE BOTTOM DOCK */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-3xl flex flex-col items-center">
        {/* Collapse / Zen mode toggle tab */}
        <button
          type="button"
          onClick={() => setIsHudCollapsed(!isHudCollapsed)}
          className="mb-1 px-3 py-0.5 rounded-t-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-x border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-xs"
        >
          {isHudCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Show Orbital Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Hide Dock (Zen View)</span>
            </>
          )}
        </button>

        {/* Unified Bottom Control Deck */}
        {!isHudCollapsed && (
          <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-200">
            {/* Play/Pause & Speed */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-xl transition-colors ${
                  isPlaying
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title={isPlaying ? 'Pause 3D rotation & dynamics' : 'Play 3D animation'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cameraRef.current && controlsRef.current) {
                    cameraRef.current.position.set(0, 8, 22);
                    controlsRef.current.target.set(0, 0, 0);
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Reset Camera Angle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Sliders: Cross-Section Cutaway & Exploded Layers */}
            <div className="flex-1 flex flex-wrap items-center gap-3 sm:gap-4 w-full justify-center">
              {/* Cutaway Depth Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Cutaway:</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cutawayDepth}
                  onChange={(e) => setCutawayDepth(Number(e.target.value))}
                  className="w-20 sm:w-24 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  title="Cross-section cutaway depth"
                />
                <span className="text-[10px] font-mono text-slate-400 w-7">{cutawayDepth}%</span>
              </div>

              {/* Exploded Separation Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Explode:</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explodeSpacing}
                  onChange={(e) => setExplodeSpacing(Number(e.target.value))}
                  className="w-20 sm:w-24 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  title="Exploded layer separation"
                />
                <span className="text-[10px] font-mono text-slate-400 w-7">{explodeSpacing}%</span>
              </div>
            </div>

            {/* Camera View Angle Buttons */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCameraPreset('iso')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeCamPreset === 'iso'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('cutaway')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeCamPreset === 'cutaway'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Top Slice
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('focus')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeCamPreset === 'focus'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isNeuron ? 'Soma' : isMitochondria ? 'Matrix' : isCellularStructure ? 'Nucleus' : 'Core'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
