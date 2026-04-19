// Rotating color palette for dynamic income/expense types
const COLOR_PALETTE = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
];

const DEFAULT_COLOR = 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400';

// Known type → preferred color (for backward compatibility)
const KNOWN_COLORS = {
  // Income types
  MAINTENANCE: COLOR_PALETTE[0],   // blue
  CORPUS: COLOR_PALETTE[1],        // emerald
  MEMBERSHIP: COLOR_PALETTE[2],    // purple
  AMENITY_BOOKING: COLOR_PALETTE[3], // amber
  // Expense types
  ELECTRICITY: COLOR_PALETTE[8],   // yellow
  WATER: COLOR_PALETTE[4],         // cyan
  SECURITY: COLOR_PALETTE[0],      // blue
  SALARY: COLOR_PALETTE[9],        // green
  CLEANING: COLOR_PALETTE[5],      // pink
  GARDENING: COLOR_PALETTE[1],     // emerald
  REPAIRS: COLOR_PALETTE[2],       // purple
  OTHER: DEFAULT_COLOR,
};

export function getTypeColor(code) {
  if (KNOWN_COLORS[code]) return KNOWN_COLORS[code];
  // Hash-based color from palette for unknown types
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export { DEFAULT_COLOR, COLOR_PALETTE };
