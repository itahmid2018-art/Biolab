import React, { useState } from 'react';
import {
  Sparkles,
  Info,
  HelpCircle,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Atom,
} from 'lucide-react';
import { Topic, CellularCompartmentInfo, Character } from '../types';

interface CellOrganelle2DViewerProps {
  topic: Topic;
  darkMode: boolean;
  activeCharacter?: Character;
  onAskTutor?: (question: string) => void;
}

export const CellOrganelle2DViewer: React.FC<CellOrganelle2DViewerProps> = ({
  topic,
  darkMode,
  activeCharacter,
  onAskTutor,
}) => {
  const [selectedHotspot, setSelectedHotspot] = useState<CellularCompartmentInfo | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const isNeuron = topic.id === 'neuron-cell' || topic.structureType === 'neuron';
  const isMitochondria = topic.id === 'mitochondria-organelle' || topic.structureType === 'mitochondria';

  // Hotspot coordinates & metadata
  const neuronHotspots: Array<{ id: string; x: number; y: number; label: string }> = [
    { id: 'soma', x: 190, y: 220, label: 'Soma (Perikaryon)' },
    { id: 'nucleus', x: 185, y: 195, label: 'Nucleus & DNA' },
    { id: 'dendrites', x: 80, y: 130, label: 'Dendritic Arbor' },
    { id: 'axon-hillock', x: 285, y: 225, label: 'Axon Hillock (Trigger)' },
    { id: 'myelin-sheath', x: 420, y: 185, label: 'Myelin Sheath' },
    { id: 'nodes-ranvier', x: 505, y: 245, label: 'Node of Ranvier' },
    { id: 'synapse-terminal', x: 740, y: 210, label: 'Synaptic Boutons' },
  ];

  const mitochondriaHotspots: Array<{ id: string; x: number; y: number; label: string }> = [
    { id: 'outer-membrane', x: 120, y: 90, label: 'Outer Membrane (OMM)' },
    { id: 'intermembrane-space', x: 260, y: 105, label: 'Intermembrane Space (H+ Reservoir)' },
    { id: 'cristae-folds', x: 380, y: 190, label: 'Folded Cristae Sheets' },
    { id: 'atp-synthase', x: 490, y: 135, label: 'F0F1 ATP Synthase' },
    { id: 'matrix', x: 580, y: 260, label: 'Mitochondrial Matrix' },
    { id: 'mtdna', x: 270, y: 310, label: 'Circular mtDNA' },
  ];

  const currentHotspots = isNeuron ? neuronHotspots : mitochondriaHotspots;

  const handleHotspotClick = (id: string) => {
    const comp = topic.cellularCompartments?.find((c) => c.id === id);
    if (comp) {
      setSelectedHotspot(selectedHotspot?.id === id ? null : comp);
    }
  };

  return (
    <div className="relative w-full bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-4 sm:p-6 select-none shadow-inner">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isNeuron ? '2D Anatomical Cross-Section: Multipolar Motor Neuron' : '2D Ultrastructural Cross-Section: Mitochondrion'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive histological schematic with labeled micro-compartments and bioenergetics
            </p>
          </div>
        </div>

        {topic.cellularMetrics && (
          <div className="flex items-center gap-2">
            {Object.entries(topic.cellularMetrics).slice(0, 2).map(([key, val]) => (
              <span
                key={key}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 shadow-2xs"
              >
                <span className="text-slate-400 uppercase">{key}:</span> <strong className="text-indigo-600 dark:text-indigo-400">{val}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive SVG Anatomical Diagram */}
      <div className="relative w-full aspect-[16/9] max-h-[460px] bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {isNeuron ? (
          // ======================= 2D NEURON SVG =======================
          <svg viewBox="0 0 840 440" className="w-full h-full filter drop-shadow-xs">
            <defs>
              <linearGradient id="somaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="myelinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="axonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Background Grid Pattern */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={darkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
            </pattern>
            <rect width="840" height="440" fill="url(#grid)" />

            {/* Dendrite Branches */}
            <g stroke="#6366f1" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.85">
              <path d="M 160 170 Q 110 130 60 90 M 110 130 Q 80 170 40 160" />
              <path d="M 140 220 Q 90 230 40 220 M 90 230 Q 70 270 30 280" />
              <path d="M 160 270 Q 120 320 60 360 M 120 320 Q 140 370 100 400" />
              <path d="M 200 150 Q 190 90 170 40 M 190 90 Q 230 60 250 30" />
              <path d="M 220 290 Q 220 350 200 400" />
            </g>

            {/* Dendritic Spines */}
            <g fill="#38bdf8">
              <circle cx="58" cy="88" r="4" />
              <circle cx="38" cy="158" r="4" />
              <circle cx="28" cy="278" r="4" />
              <circle cx="58" cy="358" r="4" />
              <circle cx="168" cy="38" r="4" />
              <circle cx="248" cy="28" r="4" />
            </g>

            {/* Soma (Cell Body) */}
            <polygon
              points="150,170 190,140 230,160 255,210 235,260 190,285 145,260 135,210"
              fill="url(#somaGrad)"
              stroke="#4338ca"
              strokeWidth="3"
            />

            {/* Nucleus & Nucleolus */}
            <circle cx="190" cy="215" r="34" fill="#a855f7" stroke="#7e22ce" strokeWidth="2.5" />
            <circle cx="184" cy="208" r="13" fill="#f43f5e" />
            <text x="180" y="240" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">DNA</text>

            {/* Axon Hillock (Funnel) */}
            <polygon points="255,200 305,216 305,224 255,240" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />

            {/* Axon Fiber Core */}
            <rect x="305" y="217" width="370" height="6" fill="url(#axonGrad)" />

            {/* Myelin Sheath Wraps (5 Segments) */}
            {[
              { x: 315, w: 60 },
              { x: 390, w: 60 },
              { x: 465, w: 60 },
              { x: 540, w: 60 },
              { x: 615, w: 60 },
            ].map((seg, idx) => (
              <g key={idx}>
                {/* Myelin Oval */}
                <rect
                  x={seg.x}
                  y="200"
                  width={seg.w}
                  height="40"
                  rx="12"
                  fill="url(#myelinGrad)"
                  stroke="#047857"
                  strokeWidth="2"
                />
                {/* Schwann Cell Nucleus */}
                <ellipse cx={seg.x + seg.w / 2} cy="207" rx="8" ry="4" fill="#065f46" />
                {/* Node of Ranvier gap ion channels (in between) */}
                {idx < 4 && (
                  <g>
                    <line x1={seg.x + seg.w + 7} y1="210" x2={seg.x + seg.w + 7} y2="230" stroke="#ec4899" strokeWidth="3" />
                    <text x={seg.x + seg.w - 2} y="192" fill="#ec4899" fontSize="9" fontWeight="bold">Na+/K+</text>
                  </g>
                )}
              </g>
            ))}

            {/* Axon Terminals & Synaptic Boutons */}
            <g stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M 675 220 Q 720 180 750 170" />
              <path d="M 675 220 Q 730 220 760 220" />
              <path d="M 675 220 Q 720 260 750 270" />
            </g>

            {/* Synaptic End Bulbs */}
            {[
              { cx: 755, cy: 170 },
              { cx: 765, cy: 220 },
              { cx: 755, cy: 270 },
            ].map((b, i) => (
              <g key={i}>
                <circle cx={b.cx} cy={b.cy} r="14" fill="#ef4444" stroke="#b91c1c" strokeWidth="2.5" />
                {/* Vesicles */}
                <circle cx={b.cx - 3} cy={b.cy - 3} r="2.5" fill="#facc15" />
                <circle cx={b.cx + 4} cy={b.cy - 2} r="2.5" fill="#facc15" />
                <circle cx={b.cx} cy={b.cy + 4} r="2.5" fill="#facc15" />
              </g>
            ))}

            {/* Action Potential Propagation Arrow & Wave */}
            <path
              d="M 320 160 Q 345 135 370 160 T 420 160 T 470 160 T 520 160 T 570 160 T 620 160"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
            <polygon points="630,160 620,154 620,166" fill="#38bdf8" />
            <text x="440" y="145" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
              Action Potential Direction (120 m/s Saltatory Conduction)
            </text>
          </svg>
        ) : (
          // ======================= 2D MITOCHONDRION SVG =======================
          <svg viewBox="0 0 840 440" className="w-full h-full filter drop-shadow-xs">
            <defs>
              <linearGradient id="ommGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="matrixGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity={darkMode ? '0.2' : '0.8'} />
                <stop offset="100%" stopColor="#fde68a" stopOpacity={darkMode ? '0.1' : '0.5'} />
              </linearGradient>
              <linearGradient id="cristaeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Background Grid Pattern */}
            <pattern id="mGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={darkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
            </pattern>
            <rect width="840" height="440" fill="url(#mGrid)" />

            {/* Outer Mitochondrial Membrane (OMM Capsule) */}
            <rect
              x="80"
              y="60"
              width="680"
              height="320"
              rx="160"
              fill="none"
              stroke="url(#ommGrad)"
              strokeWidth="12"
            />

            {/* VDAC Porins on Outer Membrane */}
            {[140, 240, 360, 480, 600, 700].map((px, i) => (
              <g key={i}>
                <circle cx={px} cy="60" r="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
                <circle cx={px} cy="380" r="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
              </g>
            ))}

            {/* Intermembrane Space (IMS gap between OMM and IMM) */}
            <rect
              x="96"
              y="76"
              width="648"
              height="288"
              rx="144"
              fill="url(#matrixGrad)"
              stroke="#fbbf24"
              strokeWidth="4"
            />

            {/* Inner Folded Cristae (Invaginations reaching into matrix) */}
            <path
              d="
                M 190 78 C 190 170, 230 200, 270 200 C 230 200, 205 150, 205 78
                M 310 78 C 310 230, 350 250, 400 250 C 350 250, 325 180, 325 78
                M 450 78 C 450 220, 500 240, 540 240 C 500 240, 470 170, 470 78
                M 590 78 C 590 190, 630 210, 670 210 C 630 210, 605 160, 605 78
                M 250 362 C 250 260, 290 230, 330 230 C 290 230, 265 290, 265 362
                M 380 362 C 380 230, 430 200, 470 200 C 430 200, 395 280, 395 362
                M 520 362 C 520 250, 560 220, 600 220 C 560 220, 535 290, 535 362
              "
              fill="url(#cristaeGrad)"
              stroke="#991b1b"
              strokeWidth="2"
            />

            {/* ATP Synthase Nanomotors Studded along Cristae */}
            {[
              { x: 275, y: 195 },
              { x: 405, y: 245 },
              { x: 545, y: 235 },
              { x: 335, y: 225 },
              { x: 475, y: 195 },
            ].map((pt, i) => (
              <g key={i}>
                <line x1={pt.x} y1={pt.y} x2={pt.x + 8} y2={pt.y} stroke="#10b981" strokeWidth="2.5" />
                <circle cx={pt.x + 12} cy={pt.y} r="5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
                <text x={pt.x + 18} y={pt.y + 4} fill="#22c55e" fontSize="8" fontWeight="bold">ATP</text>
              </g>
            ))}

            {/* Circular mtDNA plasmid loop */}
            <ellipse cx="230" cy="290" rx="36" ry="24" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 3" />
            <text x="230" y="294" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">mtDNA</text>

            {/* 70S Mitoribosomes */}
            {[
              [160, 220], [180, 270], [320, 310], [440, 310], [560, 310], [620, 260], [480, 140], [360, 140]
            ].map(([rx, ry], i) => (
              <circle key={i} cx={rx} cy={ry} r="3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            ))}

            {/* Proton Gradient Arrow */}
            <path d="M 170 110 Q 185 85 200 110" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
            <text x="210" y="112" fill="#38bdf8" fontSize="11" fontWeight="bold">
              High H+ Proton Gradient (ΔpH 1.4)
            </text>
          </svg>
        )}

        {/* Interactive Hotspot Buttons Overlay */}
        {currentHotspots.map((hs) => {
          const comp = topic.cellularCompartments?.find((c) => c.id === hs.id);
          const isSelected = selectedHotspot?.id === hs.id;
          const isHovered = hoveredHotspot === hs.id;

          // Convert viewBox 840x440 to percentages
          const leftPct = (hs.x / 840) * 100;
          const topPct = (hs.y / 440) * 100;

          return (
            <div
              key={hs.id}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
            >
              <button
                type="button"
                onClick={() => handleHotspotClick(hs.id)}
                onMouseEnter={() => setHoveredHotspot(hs.id)}
                onMouseLeave={() => setHoveredHotspot(null)}
                className={`relative flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isSelected
                    ? 'w-7 h-7 bg-indigo-600 text-white ring-4 ring-indigo-400/40 shadow-lg scale-110'
                    : isHovered
                    ? 'w-6 h-6 bg-indigo-500 text-white ring-2 ring-indigo-300 shadow-md scale-105'
                    : 'w-5 h-5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-400 shadow-2xs hover:scale-105'
                }`}
                title={hs.label}
              >
                <span className="text-[10px] font-bold">●</span>
              </button>

              {/* Pin Tag Label */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap pointer-events-none transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900/85 text-slate-100 backdrop-blur-xs opacity-0 group-hover:opacity-100'
                }`}
              >
                {hs.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Hotspot Detailed Card */}
      {selectedHotspot && (
        <div className="mt-4 p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedHotspot.color }}
              />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedHotspot.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-200/80 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-semibold">
                {selectedHotspot.tag}
              </span>
            </div>

            {onAskTutor && (
              <button
                type="button"
                onClick={() => onAskTutor(`Explain why the ${selectedHotspot.name} is so essential for the ${topic.title.split(':')[0]}!`)}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ask Sofia About This Structure →</span>
              </button>
            )}
          </div>

          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
            {selectedHotspot.function}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-indigo-100 dark:border-indigo-900/60">
            <div>
              <strong className="text-slate-700 dark:text-slate-300">Anatomical Location:</strong> {selectedHotspot.location}
            </div>
            {selectedHotspot.dimensions && (
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Scale / Dimensions:</strong> {selectedHotspot.dimensions}
              </div>
            )}
            {selectedHotspot.keyMolecules && (
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Key Molecular Machinery:</strong>{' '}
                {selectedHotspot.keyMolecules.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
