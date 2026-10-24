import { Badge } from '../types';

export const BADGES: Badge[] = [
  {
    id: 'first-inquiry',
    title: 'Curious Spark',
    description: 'Asked your very first scientific question to a personal AI tutor.',
    icon: '💡',
    category: 'curiosity',
    xpReward: 25,
  },
  {
    id: 'molecular-architect',
    title: 'Atomic Eye',
    description: 'Rotated and inspected an amino acid residue in the 3D macromolecule viewer.',
    icon: '🔬',
    category: 'exploration',
    xpReward: 30,
  },
  {
    id: 'quiz-whiz',
    title: 'Perfect Recall',
    description: 'Scored 100% on a dynamic NotebookLM retention challenge.',
    icon: '🎯',
    category: 'mastery',
    xpReward: 50,
  },
  {
    id: 'podcast-scholar',
    title: 'Audio Naturalist',
    description: 'Listened to a 2-host conversational Audio Overview podcast episode.',
    icon: '🎧',
    category: 'exploration',
    xpReward: 35,
  },
  {
    id: 'tutor-trio',
    title: 'Hive of Minds',
    description: 'Consulted 3 different virtual AI tutors with their unique perspectives.',
    icon: '🤝',
    category: 'curiosity',
    xpReward: 40,
  },
  {
    id: 'deep-focus-zen',
    title: 'Zen Concentration',
    description: 'Studied in distraction-free Focus Mode with the ambient timer running.',
    icon: '🧘',
    category: 'focus',
    xpReward: 30,
  },
  {
    id: 'cellular-detective',
    title: 'Cellular Detective',
    description: 'Earned 150+ knowledge points exploring the machinery of life.',
    icon: '🔍',
    category: 'mastery',
    xpReward: 60,
  },
  {
    id: 'bioscience-master',
    title: 'Master Naturalist',
    description: 'Demonstrated mastery across 4 or more biological curriculum topics.',
    icon: '🏆',
    category: 'mastery',
    xpReward: 100,
  },
];

export const LEVEL_TIERS = [
  { level: 1, minXp: 0, title: 'Curious Sprout', icon: '🌱' },
  { level: 2, minXp: 60, title: 'Lab Apprentice', icon: '🧪' },
  { level: 3, minXp: 150, title: 'Cellular Detective', icon: '🔍' },
  { level: 4, minXp: 280, title: 'Molecular Explorer', icon: '🧬' },
  { level: 5, minXp: 450, title: 'Master Naturalist', icon: '🌟' },
  { level: 6, minXp: 700, title: 'Chief Biomolecular Pioneer', icon: '👑' },
];

export function calculateLevel(xp: number) {
  let currentTier = LEVEL_TIERS[0];
  let nextTier = LEVEL_TIERS[1];

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
      nextTier = LEVEL_TIERS[i + 1] || { ...currentTier, minXp: currentTier.minXp + 300 };
      break;
    }
  }

  const xpInCurrentLevel = xp - currentTier.minXp;
  const xpNeededForNext = nextTier.minXp - currentTier.minXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

  return {
    level: currentTier.level,
    title: currentTier.title,
    icon: currentTier.icon,
    currentXp: xp,
    nextLevelXp: nextTier.minXp,
    progressPercent,
  };
}
