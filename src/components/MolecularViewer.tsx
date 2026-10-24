import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, RotateCcw, Play, Pause, Eye, Sparkles, Layers, Palette, Info } from 'lucide-react';
import * as $3Dmol from '3dmol';
import { Topic } from '../types';

interface MolecularViewerProps {
  topic: Topic;
  darkMode: boolean;
  onResidueSelect?: (info: { name: string; resi: number; chain: string }) => void;
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  topic,
  darkMode,
  onResidueSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const spinIntervalRef = useRef<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [renderStyle, setRenderStyle] = useState<'cartoon' | 'stick' | 'sphere' | 'surface'>('cartoon');
  const [colorMode, setColorMode] = useState<'spectrum' | 'chain' | 'plddt' | 'secondary'>('spectrum');
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [selectedResidue, setSelectedResidue] = useState<{
    name: string;
    resi: number;
    chain: string;
    b?: number;
  } | null>(null);

  // Initialize viewer once on container mount
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Clear container children if re-initializing
      containerRef.current.innerHTML = '';
      
      const bgColor = darkMode ? '#0f172a' : '#f8fafc';
      const viewer = $3Dmol.createViewer(containerRef.current, {
        defaultcolors: ($3Dmol as any).rasmolElementColors || {},
        backgroundColor: bgColor,
      });

      viewerRef.current = viewer;

      // Clickable atom handler
      viewer.setClickable({}, true, (atom: any) => {
        if (!atom) return;
        const resInfo = {
          name: atom.resn || 'UNK',
          resi: atom.resi || 0,
          chain: atom.chain || 'A',
          b: atom.b,
        };
        setSelectedResidue(resInfo);
        if (onResidueSelect) {
          onResidueSelect(resInfo);
        }

        // Add visual indicator sphere at clicked atom
        try {
          viewer.removeAllShapes();
          viewer.addSphere({
            center: { x: atom.x, y: atom.y, z: atom.z },
            radius: 1.8,
            color: '#38bdf8',
            opacity: 0.6,
          });
          viewer.render();
        } catch {
          // ignore shape error
        }
      });
    } catch (e: any) {
      console.warn('Could not initialize 3Dmol viewer:', e);
      setLoadError('WebGL 3D canvas could not be initialized on this display.');
    }

    return () => {
      if (spinIntervalRef.current) {
        window.clearInterval(spinIntervalRef.current);
      }
      viewerRef.current = null;
    };
  }, [darkMode]);

  // Load structure whenever topic or pdbId changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !topic.pdbId) return;

    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    setSelectedResidue(null);

    const fetchStructure = async () => {
      try {
        const res = await fetch(`/api/science/pdb/${topic.pdbId}`);
        if (!res.ok) {
          throw new Error(`Failed to load PDB ${topic.pdbId} (HTTP ${res.status})`);
        }
        const cifData = await res.text();
        if (!isMounted) return;

        viewer.clear();
        viewer.removeAllShapes();
        viewer.addModel(cifData, 'cif');

        applyCurrentStyle(viewer, renderStyle, colorMode);
        viewer.zoomTo();
        viewer.render();
        setLoading(false);
      } catch (err: any) {
        console.error('Error rendering PDB structure:', err);
        if (isMounted) {
          setLoadError(`Unable to render structure ${topic.pdbId}: ${err.message}`);
          setLoading(false);
        }
      }
    };

    fetchStructure();

    return () => {
      isMounted = false;
    };
  }, [topic.pdbId]);

  // Helper to apply render style and coloring
  const applyCurrentStyle = (
    viewer: any,
    style: 'cartoon' | 'stick' | 'sphere' | 'surface',
    color: 'spectrum' | 'chain' | 'plddt' | 'secondary'
  ) => {
    if (!viewer) return;

    try {
      viewer.setStyle({}, {}); // Reset styles

      let colorScheme: any = 'spectrum';
      let colorFunc: any = undefined;

      if (color === 'spectrum') {
        colorScheme = 'spectrum';
      } else if (color === 'chain') {
        colorScheme = 'chain';
      } else if (color === 'secondary') {
        colorScheme = 'ssJmol';
      } else if (color === 'plddt') {
        // Canonical AlphaFold pLDDT 4-band color function
        colorFunc = (atom: any) => {
          const b = atom.b || 80;
          if (b > 90) return '#0053D6'; // Very high: deep blue
          if (b > 70) return '#65CBF3'; // Confident: light blue
          if (b > 50) return '#FFDB13'; // Low: yellow
          return '#FF7D45';             // Very low: orange
        };
      }

      if (style === 'cartoon') {
        if (colorFunc) {
          viewer.setStyle({}, { cartoon: { colorfunc: colorFunc } });
        } else {
          viewer.setStyle({}, { cartoon: { color: colorScheme } });
        }
      } else if (style === 'stick') {
        viewer.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.25 } });
      } else if (style === 'sphere') {
        viewer.setStyle({}, { sphere: { scale: 0.75, colorscheme: 'Jmol' } });
      } else if (style === 'surface') {
        viewer.setStyle({}, { cartoon: { color: 'spectrum', opacity: 0.5 } });
        try {
          viewer.addSurface(($3Dmol as any).SurfaceType.VDW, {
            opacity: 0.7,
            color: '#38bdf8',
          });
        } catch {
          viewer.setStyle({}, { sphere: { scale: 0.8, color: 'spectrum' } });
        }
      }

      // Keep ligands and cofactor heteroatoms prominent
      viewer.setStyle(
        { hetflag: true, resn: ['HOH', 'WAT'], invert: true },
        {
          stick: { radius: 0.35, colorscheme: 'Jmol' },
          sphere: { scale: 0.35, colorscheme: 'Jmol' },
        }
      );

      viewer.render();
    } catch (e) {
      console.warn('Could not apply molecular style:', e);
    }
  };

  // Update styles on state changes
  useEffect(() => {
    if (viewerRef.current && !loading && !loadError) {
      applyCurrentStyle(viewerRef.current, renderStyle, colorMode);
    }
  }, [renderStyle, colorMode, loading, loadError]);

  // Handle spin / rotation
  useEffect(() => {
    if (spinIntervalRef.current) {
      window.clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }

    if (isSpinning && viewerRef.current) {
      spinIntervalRef.current = window.setInterval(() => {
        try {
          viewerRef.current.rotate(0.7, 'y');
          viewerRef.current.render();
        } catch {
          // silent catch during transition
        }
      }, 35);
    }

    return () => {
      if (spinIntervalRef.current) {
        window.clearInterval(spinIntervalRef.current);
      }
    };
  }, [isSpinning]);

  const handleResetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.removeAllShapes();
      viewerRef.current.zoomTo();
      viewerRef.current.render();
      setSelectedResidue(null);
    }
  };

  return (
    <div className="relative flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* Top Header & Epistemic Provenance Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <span>Interactive 3D Macromolecule</span>
              <span className="text-slate-400 dark:text-slate-600 font-normal">·</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">PDB {topic.pdbId}</span>
            </div>
            {/* Scientific Provenance unboxed text without pill wrappers */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{topic.provenance.type}</span>
              <span aria-hidden="true">·</span>
              <span>{topic.provenance.experimentalMethod || 'Crystallographic Coordinates'}</span>
              <span aria-hidden="true">·</span>
              <a
                href={topic.provenance.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>View on RCSB PDB</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* View Controls: Rotation & Camera Reset */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSpinning(!isSpinning)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border ${
              isSpinning
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
            title={isSpinning ? 'Pause auto-rotation' : 'Start auto-rotation'}
          >
            {isSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSpinning ? 'Rotate On' : 'Rotate Off'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Reset 3D camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Container */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-900 overflow-hidden cursor-grab active:cursor-grabbing select-none">
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xs text-white z-10">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-300">Loading atomic coordinates for PDB {topic.pdbId}...</p>
            <p className="text-[11px] text-slate-400 mt-1">Direct from Research Collaboratory for Structural Bioinformatics</p>
          </div>
        )}

        {/* Load Error Fallback */}
        {loadError && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-200 z-10 text-center">
            <Info className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-slate-100">{loadError}</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              You can still inspect the full biological curriculum notes and question your friendly AI tutor!
            </p>
          </div>
        )}

        {/* Click-to-Inspect Floating Residue Card */}
        {selectedResidue && (
          <div className="absolute top-3 left-3 z-20 max-w-xs p-3 rounded-lg bg-slate-900/90 border border-slate-700 backdrop-blur-md text-white shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="text-xs font-semibold text-cyan-300">Selected Residue</span>
              <button
                type="button"
                onClick={() => setSelectedResidue(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Amino Acid:</span>
                <span className="font-mono font-medium text-slate-200">{selectedResidue.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Position & Chain:</span>
                <span className="font-mono font-medium text-slate-200">Residue #{selectedResidue.resi} (Chain {selectedResidue.chain})</span>
              </div>
              {selectedResidue.b !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">B-factor / Stability:</span>
                  <span className="font-mono font-medium text-slate-200">{selectedResidue.b.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-cyan-400 mt-2">
              💡 Tip: Ask your tutor: &quot;What does residue #{selectedResidue.resi} do in this protein?&quot;
            </p>
          </div>
        )}

        {/* Interactive Mouse Guidance overlay */}
        <div className="absolute bottom-2 right-3 z-10 pointer-events-none text-[10px] text-slate-400 bg-slate-900/70 px-2 py-0.5 rounded-sm backdrop-blur-xs">
          Left Drag: Rotate · Scroll: Zoom · Click: Inspect Residue
        </div>
      </div>

      {/* Style & Representation Ribbon (Functional segmented controls) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Shape Style */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>Structure:</span>
          </span>
          <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setRenderStyle('cartoon')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                renderStyle === 'cartoon'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ribbon Cartoon
            </button>
            <button
              type="button"
              onClick={() => setRenderStyle('stick')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                renderStyle === 'stick'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Atomic Sticks
            </button>
            <button
              type="button"
              onClick={() => setRenderStyle('sphere')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                renderStyle === 'sphere'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Spacefill Spheres
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1">
            <Palette className="w-3 h-3" />
            <span>Coloring:</span>
          </span>
          <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setColorMode('spectrum')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                colorMode === 'spectrum'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Rainbow Spectrum
            </button>
            <button
              type="button"
              onClick={() => setColorMode('secondary')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                colorMode === 'secondary'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Helices & Sheets
            </button>
            <button
              type="button"
              onClick={() => setColorMode('chain')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                colorMode === 'chain'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              By Subunit Chain
            </button>
            <button
              type="button"
              onClick={() => setColorMode('plddt')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                colorMode === 'plddt'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="AlphaFold canonical 4-band pLDDT confidence gradient"
            >
              Confidence (pLDDT)
            </button>
          </div>
        </div>
      </div>

      {/* Molecular Feature Callouts for Kids */}
      {topic.molecularHighlights && topic.molecularHighlights.length > 0 && (
        <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-950/40 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Key Features In This 3D Structure:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {topic.molecularHighlights.map((hl, i) => (
              <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: hl.color }}
                  aria-hidden="true"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{hl.name}: </span>
                  <span>{hl.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
