import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  RotateCcw,
  Play,
  Pause,
  Eye,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
  Atom,
  Binary,
  Maximize2,
  Minimize2,
  Tag,
  CheckCircle2,
  HelpCircle,
  FlaskConical,
} from 'lucide-react';
import * as $3Dmol from '3dmol';
import { Topic, ChemicalCompoundInfo, MolecularLabel, Character } from '../types';

interface MolecularStructureHeroProps {
  topic: Topic;
  darkMode: boolean;
  activeCharacter?: Character;
  onAskQuestionAboutGroup?: (groupName: string) => void;
}

export const MolecularStructureHero: React.FC<MolecularStructureHeroProps> = ({
  topic,
  darkMode,
  activeCharacter,
  onAskQuestionAboutGroup,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const spinIntervalRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Default to 'stick' (Ball & Stick) for small molecules like Sugar & Methane, and 'cartoon' for DNA & proteins
  const isSmallMolecule = topic.structureType === 'small_molecule' || topic.id === 'sugar-glucose' || topic.id === 'methane-molecule';
  const [renderStyle, setRenderStyle] = useState<'stick' | 'sphere' | 'cartoon'>(
    isSmallMolecule ? 'stick' : 'cartoon'
  );
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [selectedGroup, setSelectedGroup] = useState<ChemicalCompoundInfo | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<MolecularLabel | null>(null);
  const [activeHighlightAtom, setActiveHighlightAtom] = useState<string | null>(null);

  // Initialize or update default renderStyle when topic changes
  useEffect(() => {
    if (isSmallMolecule) {
      setRenderStyle('stick');
    } else {
      setRenderStyle('cartoon');
    }
  }, [topic.id, isSmallMolecule]);

  // Initialize 3Dmol viewer canvas
  useEffect(() => {
    if (viewMode !== '3d' || !containerRef.current) return;

    try {
      containerRef.current.innerHTML = '';
      const bgColor = darkMode ? '#0f172a' : '#f8fafc';
      const viewer = $3Dmol.createViewer(containerRef.current, {
        defaultcolors: ($3Dmol as any).rasmolElementColors || {},
        backgroundColor: bgColor,
      });

      viewerRef.current = viewer;

      viewer.setClickable({}, true, (atom: any) => {
        if (!atom) return;
        const elem = atom.elem || atom.atom || 'Atom';
        const resn = atom.resn || '';
        const resi = atom.resi || '';
        setActiveHighlightAtom(`${elem} ${resn ? `(${resn} #${resi})` : ''}`);
        
        try {
          viewer.removeAllShapes();
          viewer.addSphere({
            center: { x: atom.x, y: atom.y, z: atom.z },
            radius: 1.4,
            color: '#38bdf8',
            opacity: 0.65,
          });
          viewer.render();
        } catch {
          // ignore
        }
      });
    } catch (e: any) {
      console.warn('Could not initialize 3Dmol viewer:', e);
      setLoadError('3D WebGL canvas could not be initialized.');
    }

    return () => {
      if (spinIntervalRef.current) {
        window.clearInterval(spinIntervalRef.current);
      }
      viewerRef.current = null;
    };
  }, [viewMode, darkMode]);

  // Load structure coordinates
  useEffect(() => {
    if (viewMode !== '3d') return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    setActiveHighlightAtom(null);

    const loadCoordinates = async () => {
      try {
        let structureText = '';
        let format: 'pdb' | 'cif' | 'sdf' = 'pdb';

        // 1. Check embedded sdfCoordinates on topic
        if (topic.sdfCoordinates) {
          structureText = topic.sdfCoordinates;
          format = 'pdb';
        } else if (topic.pdbId) {
          const res = await fetch(`/api/science/structure/${topic.pdbId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          structureText = await res.text();
          format = 'cif';
        } else if (topic.pubchemCid) {
          const res = await fetch(`/api/science/structure/${topic.pubchemCid}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          structureText = await res.text();
          format = 'sdf';
        } else {
          // General structure fallback by ID
          const res = await fetch(`/api/science/structure/${topic.id}`);
          if (res.ok) {
            structureText = await res.text();
            format = 'pdb';
          }
        }

        if (!structureText) {
          throw new Error('No coordinate data available for this structure.');
        }

        if (!isMounted) return;

        viewer.clear();
        viewer.removeAllShapes();
        viewer.addModel(structureText, format);

        applyViewerStyle(viewer, renderStyle);
        viewer.zoomTo();
        viewer.render();
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading molecular structure coordinates:', err);
        if (isMounted) {
          setLoadError(`Unable to render structure coordinates: ${err.message}`);
          setLoading(false);
        }
      }
    };

    loadCoordinates();

    return () => {
      isMounted = false;
    };
  }, [topic.id, topic.pdbId, topic.pubchemCid, topic.sdfCoordinates, viewMode]);

  const applyViewerStyle = (viewer: any, style: 'stick' | 'sphere' | 'cartoon') => {
    if (!viewer) return;
    try {
      viewer.setStyle({}, {});

      if (style === 'cartoon') {
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        // Ligands and nucleotides in stick
        viewer.setStyle(
          { hetflag: true, invert: false },
          { stick: { colorscheme: 'Jmol', radius: 0.3 } }
        );
        // Base pairs in DNA
        viewer.setStyle(
          { resn: ['DA', 'DT', 'DG', 'DC', 'A', 'T', 'G', 'C'] },
          { stick: { colorscheme: 'Jmol', radius: 0.25 }, cartoon: { color: 'spectrum' } }
        );
      } else if (style === 'stick') {
        // High fidelity Ball & Stick with Jmol element colors
        viewer.setStyle(
          {},
          {
            stick: { colorscheme: 'Jmol', radius: 0.28 },
            sphere: { colorscheme: 'Jmol', scale: 0.32 },
          }
        );
      } else if (style === 'sphere') {
        // Spacefilling van der Waals representation
        viewer.setStyle({}, { sphere: { colorscheme: 'Jmol', scale: 0.85 } });
      }

      viewer.render();
    } catch (e) {
      console.warn('Failed to apply viewer style:', e);
    }
  };

  useEffect(() => {
    if (viewerRef.current && !loading && !loadError && viewMode === '3d') {
      applyViewerStyle(viewerRef.current, renderStyle);
    }
  }, [renderStyle, loading, loadError, viewMode]);

  // Auto-rotation loop
  useEffect(() => {
    if (spinIntervalRef.current) {
      window.clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }

    if (isSpinning && viewerRef.current && viewMode === '3d') {
      spinIntervalRef.current = window.setInterval(() => {
        try {
          viewerRef.current.rotate(0.65, 'y');
          viewerRef.current.render();
        } catch {
          // ignore rotation tick error during unload
        }
      }, 35);
    }

    return () => {
      if (spinIntervalRef.current) {
        window.clearInterval(spinIntervalRef.current);
      }
    };
  }, [isSpinning, viewMode]);

  const handleResetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.removeAllShapes();
      viewerRef.current.zoomTo();
      viewerRef.current.render();
      setActiveHighlightAtom(null);
    }
  };

  // 2D Diagram Content based on molecule
  const render2DDiagram = () => {
    if (topic.id === 'sugar-glucose' || topic.title.toLowerCase().includes('sugar') || topic.title.toLowerCase().includes('glucose')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white select-none">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              2D Haworth Ring Diagram · D-Glucose (C₆H₁₂O₆)
            </div>
            {/* Haworth Glucose Ring SVG */}
            <svg viewBox="0 0 380 240" className="w-full max-h-[220px] mx-auto filter drop-shadow-md">
              {/* Pyranose Ring C1-C5 and O5 */}
              <polygon
                points="190,45 285,90 285,175 190,210 100,165 100,85"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Ring Oxygen O5 */}
              <circle cx="190" cy="45" r="16" fill="#f59e0b" />
              <text x="190" y="51" fill="#0f172a" fontSize="13" fontWeight="bold" textAnchor="middle">O5</text>

              {/* Carbon vertices with labels */}
              {/* C1 (Anomeric) */}
              <circle cx="285" cy="90" r="14" fill="#3b82f6" />
              <text x="285" y="95" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">C1</text>
              <line x1="285" y1="90" x2="345" y2="90" stroke="#ef4444" strokeWidth="3" />
              <text x="360" y="94" fill="#ef4444" fontSize="13" fontWeight="bold">OH</text>

              {/* C2 */}
              <circle cx="285" cy="175" r="14" fill="#3b82f6" />
              <text x="285" y="180" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">C2</text>
              <line x1="285" y1="175" x2="335" y2="205" stroke="#ef4444" strokeWidth="3" />
              <text x="350" y="215" fill="#ef4444" fontSize="13" fontWeight="bold">OH</text>

              {/* C3 */}
              <circle cx="190" cy="210" r="14" fill="#3b82f6" />
              <text x="190" y="215" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">C3</text>
              <line x1="190" y1="210" x2="190" y2="238" stroke="#ef4444" strokeWidth="3" />
              <text x="190" y="235" fill="#ef4444" fontSize="13" fontWeight="bold" textAnchor="middle" dy="12">OH</text>

              {/* C4 */}
              <circle cx="100" cy="165" r="14" fill="#3b82f6" />
              <text x="100" y="170" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">C4</text>
              <line x1="100" y1="165" x2="45" y2="195" stroke="#ef4444" strokeWidth="3" />
              <text x="30" y="205" fill="#ef4444" fontSize="13" fontWeight="bold">HO</text>

              {/* C5 */}
              <circle cx="100" cy="85" r="14" fill="#3b82f6" />
              <text x="100" y="90" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">C5</text>
              {/* C6 Hydroxymethyl Arm */}
              <line x1="100" y1="85" x2="40" y2="40" stroke="#10b981" strokeWidth="3" />
              <circle cx="40" cy="40" r="12" fill="#10b981" />
              <text x="40" y="44" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">C6</text>
              <text x="40" y="22" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">CH₂OH</text>
            </svg>
            <p className="text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Key:</span> Blue circles are Carbon atoms (C1–C5), Red is the Hydroxyl polar groups (-OH) that taste sweet, and Orange (O5) is the ether oxygen bridge.
            </p>
          </div>
        </div>
      );
    }

    if (topic.id === 'methane-molecule' || topic.title.toLowerCase().includes('methane') || topic.chemicalFormula === 'CH4') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white select-none">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
              2D Wedge & Dash Projection · Methane (CH₄)
            </div>
            {/* Methane Tetrahedral Wedge-and-Dash SVG */}
            <svg viewBox="0 0 320 220" className="w-full max-h-[200px] mx-auto filter drop-shadow-md">
              {/* Central Carbon */}
              <circle cx="160" cy="110" r="24" fill="#64748b" stroke="#94a3b8" strokeWidth="3" />
              <text x="160" y="117" fill="white" fontSize="18" fontWeight="bold" textAnchor="middle">C</text>

              {/* Top Bond H1 (in-plane line) */}
              <line x1="160" y1="86" x2="160" y2="35" stroke="#38bdf8" strokeWidth="4" />
              <circle cx="160" cy="30" r="16" fill="#38bdf8" />
              <text x="160" y="36" fill="#0f172a" fontSize="14" fontWeight="bold" textAnchor="middle">H₁</text>

              {/* Left Bond H2 (in-plane line) */}
              <line x1="138" y1="120" x2="80" y2="155" stroke="#38bdf8" strokeWidth="4" />
              <circle cx="70" cy="160" r="16" fill="#38bdf8" />
              <text x="70" y="166" fill="#0f172a" fontSize="14" fontWeight="bold" textAnchor="middle">H₂</text>

              {/* Solid Wedge forward to H3 */}
              <polygon points="160,110 230,175 220,195" fill="#a855f7" />
              <circle cx="235" cy="185" r="16" fill="#a855f7" />
              <text x="235" y="191" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">H₃</text>
              <text x="260" y="200" fill="#c084fc" fontSize="10">(Wedge: pointing forward)</text>

              {/* Dashed line backward to H4 */}
              <line x1="175" y1="120" x2="235" y2="75" stroke="#f59e0b" strokeWidth="4" strokeDasharray="4,4" />
              <circle cx="245" cy="70" r="16" fill="#f59e0b" />
              <text x="245" y="76" fill="#0f172a" fontSize="14" fontWeight="bold" textAnchor="middle">H₄</text>
              <text x="265" y="60" fill="#fbbf24" fontSize="10">(Dash: pointing backward)</text>

              {/* 109.5 Degree Angle Arc */}
              <path d="M 160,70 A 40,40 0 0,0 120,110" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="3,3" />
              <text x="120" y="80" fill="#4ade80" fontSize="11" fontWeight="bold">109.5°</text>
            </svg>
            <p className="text-xs text-slate-300">
              <span className="font-semibold text-cyan-400">Regular Tetrahedron:</span> The four covalent sigma bonds repel each other symmetrically into 3D space with uniform 109.5° bond angles.
            </p>
          </div>
        </div>
      );
    }

    if (topic.id === 'dna-double-helix' || topic.title.toLowerCase().includes('dna')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white select-none">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-xs font-semibold text-purple-400 tracking-wider uppercase">
              2D Base-Pair Ladder Diagram · Human DNA (Watson-Crick Pairing)
            </div>
            {/* DNA 2D Ladder SVG */}
            <svg viewBox="0 0 360 220" className="w-full max-h-[200px] mx-auto filter drop-shadow-md">
              {/* Left Phosphate-Sugar Backbone */}
              <line x1="70" y1="20" x2="70" y2="200" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              <text x="70" y="15" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">5&apos; Rail</text>
              <text x="70" y="215" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">3&apos; Rail</text>

              {/* Right Phosphate-Sugar Backbone (Antiparallel) */}
              <line x1="290" y1="20" x2="290" y2="200" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
              <text x="290" y="15" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">3&apos; Rail</text>
              <text x="290" y="215" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">5&apos; Rail</text>

              {/* Rung 1: A = T (2 Hydrogen Bonds) */}
              <rect x="70" y="45" width="75" height="24" rx="4" fill="#3b82f6" />
              <text x="107" y="61" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Adenine (A)</text>
              <line x1="150" y1="52" x2="210" y2="52" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="150" y1="62" x2="210" y2="62" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
              <text x="180" y="48" fill="#94a3b8" fontSize="9" textAnchor="middle">2 H-Bonds</text>
              <rect x="215" y="45" width="75" height="24" rx="4" fill="#ef4444" />
              <text x="252" y="61" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Thymine (T)</text>

              {/* Rung 2: G ≡ C (3 Hydrogen Bonds) */}
              <rect x="70" y="95" width="75" height="24" rx="4" fill="#10b981" />
              <text x="107" y="111" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Guanine (G)</text>
              <line x1="150" y1="102" x2="210" y2="102" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="150" y1="107" x2="210" y2="107" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="150" y1="112" x2="210" y2="112" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
              <text x="180" y="98" fill="#94a3b8" fontSize="9" textAnchor="middle">3 H-Bonds</text>
              <rect x="215" y="95" width="75" height="24" rx="4" fill="#8b5cf6" />
              <text x="252" y="111" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Cytosine (C)</text>

              {/* Rung 3: T = A */}
              <rect x="70" y="145" width="75" height="24" rx="4" fill="#ef4444" />
              <text x="107" y="161" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Thymine (T)</text>
              <line x1="150" y1="152" x2="210" y2="152" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="150" y1="162" x2="210" y2="162" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
              <rect x="215" y="145" width="75" height="24" rx="4" fill="#3b82f6" />
              <text x="252" y="161" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Adenine (A)</text>
            </svg>
            <p className="text-xs text-slate-300">
              <span className="font-semibold text-purple-400">Strict Pairing Rule:</span> Adenine always pairs with Thymine (2 H-bonds) and Guanine always pairs with Cytosine (3 H-bonds) between antiparallel rails!
            </p>
          </div>
        </div>
      );
    }

    // Generic 2D chemical representation for other topics
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white select-none">
        <Atom className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-slate-100">{topic.title}</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Chemical Formula: {topic.chemicalFormula || 'Complex Biomolecule'} · Switch to 3D View for interactive atomic inspection.
        </p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-slate-900 shadow-md overflow-hidden transition-all mb-6">
      {/* 1. Header with Formula, Epistemic Metadata, and 2D/3D Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border-b border-indigo-100 dark:border-indigo-950">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-2xs">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {topic.title.split(':')[0]}
              </span>
              {topic.chemicalFormula && (
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                  {topic.chemicalFormula}
                </span>
              )}
              {topic.pdbId && (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  PDB: {topic.pdbId}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {topic.subtitle || 'Molecular Structure & Chemical Compounds'}
            </p>
          </div>
        </div>

        {/* 2D vs 3D Mode & View Controls */}
        <div className="flex items-center gap-2">
          {/* 2D / 3D Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === '3d'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>3D Model</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === '2d'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>2D Diagram</span>
            </button>
          </div>

          {/* 3D-specific Controls: Rotate & Reset */}
          {viewMode === '3d' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSpinning(!isSpinning)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSpinning
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title={isSpinning ? 'Pause auto-rotation' : 'Start auto-rotation'}
              >
                {isSpinning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleResetCamera}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Reset Camera View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Visual Canvas (3D WebGL or 2D SVG) */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none">
        {viewMode === '3d' ? (
          <>
            <div ref={containerRef} className="w-full h-full" />

            {/* Loading Spinner */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white z-10">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mb-3" />
                <p className="text-xs font-semibold text-slate-200">
                  Rendering 3D atomic coordinates for {topic.title.split(':')[0]}...
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Interactive WebGL Ball & Stick Modeling</p>
              </div>
            )}

            {/* Error fallback */}
            {loadError && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-200 z-10 text-center">
                <Info className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-sm font-semibold text-slate-100">{loadError}</p>
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  View 2D Structural Diagram Instead
                </button>
              </div>
            )}

            {/* Clicked Atom Tooltip */}
            {activeHighlightAtom && (
              <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-white text-xs shadow-md">
                <span className="text-cyan-400 font-semibold">Selected Atom: </span>
                <span className="font-mono">{activeHighlightAtom}</span>
              </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-2 right-3 z-10 pointer-events-none text-[10px] text-slate-400 bg-slate-900/70 px-2 py-0.5 rounded-sm backdrop-blur-xs">
              Drag: Rotate · Scroll: Zoom · Click: Inspect Atom
            </div>
          </>
        ) : (
          render2DDiagram()
        )}
      </div>

      {/* 3D Representation Style Switcher (Stick, Sphere, Cartoon) */}
      {viewMode === '3d' && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>3D Style:</span>
            </span>
            <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setRenderStyle('stick')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  renderStyle === 'stick'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ball &amp; Stick
              </button>
              <button
                type="button"
                onClick={() => setRenderStyle('sphere')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  renderStyle === 'sphere'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Spacefill Spheres
              </button>
              <button
                type="button"
                onClick={() => setRenderStyle('cartoon')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  renderStyle === 'cartoon'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ribbon / Cartoon
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Element Color Code: Carbon (Grey) · Hydrogen (Cyan/White) · Oxygen (Red) · Nitrogen (Blue) · Phosphorus (Orange)
          </div>
        </div>
      )}

      {/* 3. CHEMICAL COMPOUNDS BREAKDOWN (Explicit requirement!) */}
      {topic.chemicalCompounds && topic.chemicalCompounds.length > 0 && (
        <div className="px-4 sm:px-6 py-4 bg-white dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Chemical Compounds &amp; Molecular Components:
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Click any component to inspect details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topic.chemicalCompounds.map((comp, idx) => {
              const isSelected = selectedGroup?.name === comp.name;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedGroup(isSelected ? null : comp)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:border-indigo-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: comp.color }}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700/80 px-1.5 py-0.5 rounded">
                      {comp.formula || comp.role}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {comp.name}
                  </div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {comp.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {comp.description || comp.atoms}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Compound Detail Spotlight */}
          {selectedGroup && (
            <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-slate-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                    {selectedGroup.name} ({selectedGroup.formula})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    Role: {selectedGroup.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedGroup.description}
                </p>
                {selectedGroup.atoms && (
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Atomic composition: {selectedGroup.atoms}
                  </p>
                )}
              </div>

              {onAskQuestionAboutGroup && (
                <button
                  type="button"
                  onClick={() => onAskQuestionAboutGroup(`Tell me more about the role of ${selectedGroup.name} in ${topic.title.split(':')[0]}!`)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0 transition-colors shadow-2xs"
                >
                  Ask Tutor About This Group →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. LABELED ATOMS & BOND ANNOTATIONS */}
      {topic.molecularLabels && topic.molecularLabels.length > 0 && (
        <div className="px-4 sm:px-6 py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chemical Labels:</span>
            </span>

            {topic.molecularLabels.map((lbl) => {
              const isSelected = selectedLabel?.id === lbl.id;
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => setSelectedLabel(isSelected ? null : lbl)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs ring-1 ring-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lbl.color }}
                    aria-hidden="true"
                  />
                  <span>{lbl.name}</span>
                  {lbl.badge && (
                    <span className="text-[10px] opacity-75 font-normal">({lbl.badge})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Label Explainer Card */}
          {selectedLabel && (
            <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedLabel.color }}
                  />
                  <span>{selectedLabel.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLabel(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedLabel.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Sofia Carter / Active Tutor Empathetic Explanation of the Structure */}
      {activeCharacter && (
        <div className="px-4 sm:px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-t border-indigo-100/70 dark:border-indigo-900/40 flex items-start gap-3">
          <span className="text-2xl filter drop-shadow-2xs shrink-0 select-none">
            {activeCharacter.avatarEmoji}
          </span>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <span>{activeCharacter.name} explains this structure:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {topic.id === 'sugar-glucose'
                ? "Look at the ring! Plants bake sunlight into this sweet hexagonal wheel. Those red -OH arms grab water like tiny magnets, which is why sugar melts on your tongue so smoothly!"
                : topic.id === 'methane-molecule'
                ? "Notice how the 4 hydrogen arms point outward into a 3D pyramid! Each bond repels its neighbors equally, creating a perfect 109.5° tetrahedral balance."
                : topic.id === 'dna-double-helix'
                ? "Imagine a twisted rope ladder 2 meters long curled inside your cell! The yellow outer handrails are sugar and phosphate, while the rungs are complementary base letters holding hands across the center."
                : topic.summary.slice(0, 200) + '...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
