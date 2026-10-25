import React, { useState, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  BookOpen,
  Box,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Flame,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Topic, Character, StudentProgress, TopicMastery, UserProfile } from '../types';

export interface RoadmapNode {
  id: string;
  topicId: string;
  tier: number; // 1 to 5
  tierName: string;
  title: string;
  subtitle: string;
  category: string;
  prerequisites: string[]; // topicIds
  unlockedBy: string;
  chemicalFormula?: string;
  pdbId?: string;
  structureType?: string;
  difficulty: 'Introductory' | 'Core Science' | 'Foundational' | 'Advanced';
  estMinutes: number;
  whyNextReason: string;
  keyConcept: string;
}

// Bioscience Curriculum Learning DAG
export const BIOSCIENCE_ROADMAP_NODES: RoadmapNode[] = [
  {
    id: 'node-methane',
    topicId: 'methane-molecule',
    tier: 1,
    tierName: 'Tier 1: Atomic & Hydrocarbon Core',
    title: 'Methane (CH₄)',
    subtitle: 'Tetrahedral Geometry & Covalent Bonding',
    category: 'Chemistry & Earth Science',
    prerequisites: [],
    unlockedBy: 'Curriculum Foundation',
    chemicalFormula: 'CH₄',
    structureType: 'small_molecule',
    difficulty: 'Introductory',
    estMinutes: 3,
    whyNextReason: 'The ideal starting point to understand sp³ carbon sharing and 109.5° tetrahedral angles.',
    keyConcept: 'Carbon valence & 3D non-polar symmetry',
  },
  {
    id: 'node-glucose',
    topicId: 'sugar-glucose',
    tier: 2,
    tierName: 'Tier 2: Carbohydrates & Metabolic Energy',
    title: 'Sugar / D-Glucose (C₆H₁₂O₆)',
    subtitle: 'Pyranose Rings & Cellular ATP Fuel',
    category: 'Biochemistry & Energy',
    prerequisites: ['methane-molecule'],
    unlockedBy: 'Mastery of Methane Covalent Bonds',
    chemicalFormula: 'C₆H₁₂O₆',
    structureType: 'small_molecule',
    difficulty: 'Introductory',
    estMinutes: 4,
    whyNextReason: 'Shows how simple carbon-hydrogen bonds evolve into cyclic carbohydrate rings that fuel living cells.',
    keyConcept: 'Hexagonal pyranose ring & hydroxyl polarity',
  },
  {
    id: 'node-dna',
    topicId: 'dna-double-helix',
    tier: 3,
    tierName: 'Tier 3: The Blueprint of Life',
    title: 'DNA Double Helix',
    subtitle: 'Watson-Crick Base Pairs & Replication',
    category: 'Genetics & Molecular Biology',
    prerequisites: ['sugar-glucose'],
    unlockedBy: 'Mastery of Carbohydrates & Pentose Sugars',
    chemicalFormula: '(PO₄-Deoxyribose)n',
    pdbId: '1BNA',
    structureType: 'dna_helix',
    difficulty: 'Core Science',
    estMinutes: 5,
    whyNextReason: 'Connects deoxyribose sugars to the phosphate rails and the 4-letter genetic alphabet (A, T, G, C).',
    keyConcept: 'Complementary base pairing & antiparallel strands',
  },
  {
    id: 'node-insulin',
    topicId: 'insulin-key',
    tier: 4,
    tierName: 'Tier 4: Hormones & Molecular Keys',
    title: 'Insulin Hormone',
    subtitle: 'Disulfide Bridges & Glucose Gates',
    category: 'Metabolism & Endocrinology',
    prerequisites: ['sugar-glucose'],
    unlockedBy: 'Mastery of Glucose Metabolism',
    pdbId: '1TRZ',
    structureType: 'protein',
    difficulty: 'Core Science',
    estMinutes: 4,
    whyNextReason: 'Reveals how your body signals cells to take in glucose using precision receptor docking.',
    keyConcept: 'Peptide folding & disulfide bond stabilization',
  },
  {
    id: 'node-gfp',
    topicId: 'gfp-jellyfish',
    tier: 4,
    tierName: 'Tier 4: Fluorescent Proteins & Optogenetics',
    title: 'Green Fluorescent Protein (GFP)',
    subtitle: 'Beta-Barrel Shield & Nano-Lanterns',
    category: 'Marine Biology & Optics',
    prerequisites: ['dna-double-helix'],
    unlockedBy: 'Mastery of DNA Genetic Encoding',
    pdbId: '1EMA',
    structureType: 'protein',
    difficulty: 'Introductory',
    estMinutes: 4,
    whyNextReason: 'Demonstrates how genetic recipes are translated into glowing reporter proteins used in live cell imaging.',
    keyConcept: '11-strand beta-barrel & chromophore triad',
  },
  {
    id: 'node-hemoglobin',
    topicId: 'hemoglobin-submarine',
    tier: 5,
    tierName: 'Tier 5: Quaternary Physiology & Allostery',
    title: 'Hemoglobin Submarine',
    subtitle: 'Cooperative Binding & Heme Iron Pockets',
    category: 'Human Physiology',
    prerequisites: ['insulin-key'],
    unlockedBy: 'Mastery of Peptide Signaling',
    pdbId: '1A3N',
    structureType: 'protein',
    difficulty: 'Foundational',
    estMinutes: 5,
    whyNextReason: 'Explores large four-subunit protein machines that flex dynamically to carry oxygen throughout your body.',
    keyConcept: 'Quaternary allosteric transitions & heme Fe(II)',
  },
  {
    id: 'node-antibody',
    topicId: 'antibody-guardian',
    tier: 5,
    tierName: 'Tier 5: Adaptive Immunology & Defense',
    title: 'Immunoglobulin G (Antibody)',
    subtitle: 'Y-Shaped Shield & Antigen Handcuffs',
    category: 'Immunology & Health',
    prerequisites: ['dna-double-helix', 'gfp-jellyfish'],
    unlockedBy: 'Mastery of DNA & Fluorescent Tagging',
    pdbId: '1IGT',
    structureType: 'protein',
    difficulty: 'Foundational',
    estMinutes: 4,
    whyNextReason: 'The apex of molecular recognition: how variable protein loops remember and neutralize foreign pathogens.',
    keyConcept: 'Fab antigen-binding & Fc effector handles',
  },
  {
    id: 'node-mitochondria',
    topicId: 'mitochondria-organelle',
    tier: 6,
    tierName: 'Tier 6: Cellular Bioenergetics & Organelles',
    title: 'Mitochondrion (ATP Engine)',
    subtitle: 'Double Membrane, Cristae & Rotary ATP Synthase',
    category: 'Cellular Bioenergetics',
    prerequisites: ['sugar-glucose', 'hemoglobin-submarine'],
    unlockedBy: 'Mastery of Carbohydrates & Oxygen Transport',
    structureType: 'mitochondria',
    difficulty: 'Core Science',
    estMinutes: 5,
    whyNextReason: 'Connects glucose fuel and oxygen delivery directly into mitochondrial aerobic respiration and ATP rotary synthesis.',
    keyConcept: 'Proton electrochemical gradient & 6,000 RPM rotary nanomotors',
  },
  {
    id: 'node-cell-structure',
    topicId: 'cellular-structure',
    tier: 6,
    tierName: 'Tier 6: Cellular Architecture & Organelles',
    title: 'Animal Cellular Structure',
    subtitle: 'The Eukaryotic Metropolis of Organelles & Membranes',
    category: 'Cell Biology & Cytology',
    prerequisites: ['dna-double-helix', 'sugar-glucose'],
    unlockedBy: 'Mastery of DNA Blueprint & Energy',
    structureType: 'cell_organelle',
    difficulty: 'Core Science',
    estMinutes: 5,
    whyNextReason: 'Synthesizes genomic replication, protein manufacturing, and bioenergetics into a complete living cell model.',
    keyConcept: 'Membrane compartmentalization, ER-Golgi trafficking & lysosomes',
  },
  {
    id: 'node-neuron',
    topicId: 'neuron-cell',
    tier: 7,
    tierName: 'Tier 7: Electrophysiology & Neural Networks',
    title: 'Multipolar Motor Neuron',
    subtitle: 'Action Potentials & Saltatory Conduction',
    category: 'Neurobiology & Electrophysiology',
    prerequisites: ['mitochondria-organelle', 'dna-double-helix'],
    unlockedBy: 'Mastery of Cellular Bioenergetics & DNA',
    structureType: 'neuron',
    difficulty: 'Core Science',
    estMinutes: 6,
    whyNextReason: 'Shows how cellular ATP powers Na+/K+ pumps to maintain electrical membrane potentials, firing 120 m/s nerve impulses.',
    keyConcept: 'Saltatory jumping conduction & synaptic neurotransmitter release',
  },
];

interface StudyRoadmapProps {
  topics: Topic[];
  activeTopic: Topic;
  onSelectTopic: (topic: Topic) => void;
  progress: StudentProgress;
  currentUser: UserProfile | null;
  activeCharacter: Character;
  onAwardXp: (amount: number, reason: string) => void;
  onClose?: () => void;
}

export const StudyRoadmap: React.FC<StudyRoadmapProps> = ({
  topics,
  activeTopic,
  onSelectTopic,
  progress,
  currentUser,
  activeCharacter,
  onAwardXp,
  onClose,
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | 'all'>('all');

  // Map topicId to Topic object
  const topicMap = useMemo(() => {
    const map = new Map<string, Topic>();
    topics.forEach((t) => map.set(t.id, t));
    return map;
  }, [topics]);

  // Determine status for each roadmap node
  const nodeStatusMap = useMemo(() => {
    const statusMap: Record<
      string,
      {
        status: 'mastered' | 'in_progress' | 'unlocked' | 'locked';
        quizScore?: number;
        completed: boolean;
        prereqsMet: boolean;
      }
    > = {};

    BIOSCIENCE_ROADMAP_NODES.forEach((node) => {
      const mastery = progress.topicMastery[node.topicId];
      const isCompleted =
        progress.completedTopicIds.includes(node.topicId) ||
        (mastery && (mastery.completed || (mastery.bestScorePercentage ?? 0) >= 70));

      // Check prerequisites
      const prereqsMet =
        node.prerequisites.length === 0 ||
        node.prerequisites.every((prereqId) => {
          const pm = progress.topicMastery[prereqId];
          return (
            progress.completedTopicIds.includes(prereqId) ||
            (pm && (pm.completed || (pm.bestScorePercentage ?? 0) >= 60))
          );
        });

      let status: 'mastered' | 'in_progress' | 'unlocked' | 'locked' = 'locked';

      if (isCompleted) {
        status = 'mastered';
      } else if (
        node.topicId === activeTopic.id ||
        (mastery && (mastery.quizzesTaken > 0 || mastery.questionsAsked > 0))
      ) {
        status = 'in_progress';
      } else if (prereqsMet) {
        status = 'unlocked';
      } else {
        status = 'locked';
      }

      statusMap[node.topicId] = {
        status,
        quizScore: mastery?.bestScorePercentage,
        completed: Boolean(isCompleted),
        prereqsMet,
      };
    });

    return statusMap;
  }, [progress, activeTopic.id]);

  // Intelligent Recommendation Engine: find the best next topic
  const recommendedNode = useMemo(() => {
    // 1. Look for unmastered nodes whose prerequisites are fully met
    for (const node of BIOSCIENCE_ROADMAP_NODES) {
      const info = nodeStatusMap[node.topicId];
      if (info && !info.completed && info.prereqsMet) {
        return node;
      }
    }
    // 2. If all core nodes mastered, find any incomplete node
    for (const node of BIOSCIENCE_ROADMAP_NODES) {
      const info = nodeStatusMap[node.topicId];
      if (info && !info.completed) {
        return node;
      }
    }
    // 3. Fallback to active or first
    return BIOSCIENCE_ROADMAP_NODES[0];
  }, [nodeStatusMap]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalNodes = BIOSCIENCE_ROADMAP_NODES.length;
    let masteredCount = 0;
    let inProgressCount = 0;

    BIOSCIENCE_ROADMAP_NODES.forEach((node) => {
      const st = nodeStatusMap[node.topicId]?.status;
      if (st === 'mastered') masteredCount++;
      else if (st === 'in_progress') inProgressCount++;
    });

    const completionPercent = Math.round((masteredCount / totalNodes) * 100);

    return {
      totalNodes,
      masteredCount,
      inProgressCount,
      completionPercent,
    };
  }, [nodeStatusMap]);

  // Filtered nodes by tier
  const displayNodes = useMemo(() => {
    if (selectedTierFilter === 'all') return BIOSCIENCE_ROADMAP_NODES;
    return BIOSCIENCE_ROADMAP_NODES.filter((n) => n.tier === selectedTierFilter);
  }, [selectedTierFilter]);

  const handleNodeClick = (node: RoadmapNode) => {
    const topic = topicMap.get(node.topicId);
    if (topic) {
      onSelectTopic(topic);
      onAwardXp(10, `Roadmap Exploration: ${node.title}`);
      if (onClose) onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. ROADMAP HERO HEADER & STATS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 sm:p-6 text-white shadow-xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Bioscience Study Roadmap
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-medium">
                    Flowchart
                  </span>
                </h2>
                <p className="text-xs text-indigo-200/80">
                  Visual prerequisite tree from fundamental hydrocarbons to adaptive human immunity
                </p>
              </div>
            </div>

            {/* Overall Progress Badge */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
              <div className="text-right">
                <div className="text-xs text-indigo-200 font-medium">Curriculum Progress</div>
                <div className="text-base font-black text-white">
                  {stats.completionPercent}% <span className="text-xs font-normal text-indigo-300">({stats.masteredCount}/{stats.totalNodes})</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center border border-indigo-400/40">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(stats.completionPercent, 4)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-indigo-200/70 font-medium">
              <span>{stats.masteredCount} Mastered</span>
              <span>{stats.inProgressCount} In Progress</span>
              <span>{stats.totalNodes - stats.masteredCount - stats.inProgressCount} Remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTELLIGENT NEXT TOPIC RECOMMENDATION BANNER */}
      {recommendedNode && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-amber-950/40 dark:via-indigo-950/40 dark:to-emerald-950/40 border-2 border-amber-300/60 dark:border-amber-500/40 p-4 sm:p-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 text-xl">
                <span>{activeCharacter.avatarEmoji}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Recommended Next Topic
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    from {activeCharacter.name}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {recommendedNode.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {recommendedNode.whyNextReason}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    💡 Key Concept: {recommendedNode.keyConcept}
                  </span>
                  <span>·</span>
                  <span>⏱️ ~{recommendedNode.estMinutes} min read</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleNodeClick(recommendedNode)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
            >
              <span>Explore {recommendedNode.title.split(' ')[0]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. TIER FILTER CHIPS */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedTierFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Tracks (7)
          </button>
          {[1, 2, 3, 4, 5].map((tierNum) => (
            <button
              key={tierNum}
              type="button"
              onClick={() => setSelectedTierFilter(tierNum)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedTierFilter === tierNum
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tier {tierNum}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Next
          </span>
        </div>
      </div>

      {/* 4. FLOWCHART TIERS VISUALIZATION */}
      <div className="relative space-y-6">
        {/* Render each tier with connecting arrows */}
        {[1, 2, 3, 4, 5].map((tierNum) => {
          const tierNodes = displayNodes.filter((n) => n.tier === tierNum);
          if (tierNodes.length === 0) return null;

          const tierTitles: Record<number, string> = {
            1: 'Tier 1 · Foundations: Hydrocarbons & Covalent Bonds',
            2: 'Tier 2 · Bio-Energy: Pyranose Sugars & Respiration',
            3: 'Tier 3 · Genetics: DNA Double Helix & Base Pairing',
            4: 'Tier 4 · Molecular Tools: Reporter Proteins & Hormone Keys',
            5: 'Tier 5 · Advanced Systems: Quaternary Physiology & Adaptive Immunity',
          };

          return (
            <div key={tierNum} className="space-y-3">
              {/* Tier Section Header */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {tierNum}
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {tierTitles[tierNum]}
                </h4>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Tier Nodes Grid */}
              <div className={`grid gap-4 ${tierNodes.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {tierNodes.map((node) => {
                  const statusInfo = nodeStatusMap[node.topicId] || {
                    status: 'locked',
                    completed: false,
                    prereqsMet: false,
                  };
                  const isRecommended = recommendedNode?.id === node.id;
                  const isActive = activeTopic.id === node.topicId;

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleNodeClick(node)}
                      className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer ${
                        statusInfo.status === 'mastered'
                          ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/80 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 ring-1 ring-emerald-500/20'
                          : isRecommended
                          ? 'bg-gradient-to-br from-amber-500/5 via-white to-indigo-500/5 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border-amber-400 dark:border-amber-500/60 shadow-md ring-2 ring-amber-400/30 hover:shadow-lg'
                          : isActive
                          ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                          : statusInfo.status === 'in_progress'
                          ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900 hover:border-indigo-400'
                          : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Node Top Row: Badges & Status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {node.category}
                          </span>
                          {node.chemicalFormula && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {node.chemicalFormula}
                            </span>
                          )}
                          {node.pdbId && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                              PDB: {node.pdbId}
                            </span>
                          )}
                        </div>

                        {/* Status Icon */}
                        {statusInfo.status === 'mastered' ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mastered {statusInfo.quizScore ? `(${statusInfo.quizScore}%)` : ''}</span>
                          </div>
                        ) : isRecommended ? (
                          <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs font-bold bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Recommended Next</span>
                          </div>
                        ) : isActive ? (
                          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                            <span>Studying Now</span>
                          </div>
                        ) : statusInfo.status === 'in_progress' ? (
                          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                            <span>In Progress</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            <span>Prereq Needed</span>
                          </div>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {node.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {node.subtitle}
                      </p>

                      {/* Key Concept Callout */}
                      <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate">
                          ✨ <span className="font-medium">{node.keyConcept}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                          ~{node.estMinutes}m
                        </span>
                      </div>

                      {/* Prerequisite Flow Footnote */}
                      {node.prerequisites.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                          <span className="font-medium">Prerequisite:</span>
                          {node.prerequisites.map((pid) => {
                            const pTopic = topicMap.get(pid);
                            const pMet = progress.completedTopicIds.includes(pid);
                            return (
                              <span
                                key={pid}
                                className={`px-1.5 py-0.2 rounded-md ${
                                  pMet
                                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {pTopic ? pTopic.title.split(':')[0] : pid} {pMet ? '✓' : ''}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Connecting Downward Flow Indicator between tiers */}
              {tierNum < 5 && (
                <div className="flex justify-center py-1">
                  <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-700">
                    <div className="w-0.5 h-3 bg-slate-200 dark:bg-slate-800" />
                    <ChevronRight className="w-3.5 h-3.5 rotate-90 text-indigo-400 dark:text-indigo-600" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. ROADMAP FOOTER ACTION */}
      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>
            Mastering topics unlocks high-level inquiry badges and advances your Learning Passport!
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            Close Roadmap
          </button>
        )}
      </div>
    </div>
  );
};
