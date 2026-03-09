export const ROLES = ['All', 'Tank', 'Damage', 'Support'] as const
export type OWRole = (typeof ROLES)[number]
export const DEFAULT_ROLE: OWRole = "All"

export const TIERS = [
  'All',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Master',
  'Grandmaster',
] as const
export type OWTier = (typeof TIERS)[number]
export const DEFAULT_TIER: OWTier = "All"

export const MAPS = [
  'all-maps',
  'busan',
  'ilios',
  'lijiang-tower',
  'nepal',
  'oasis',
  'samoa',
  'circuit-royal',
  'dorado',
  'havana',
  'junkertown',
  'rialto',
  'route-66',
  'shambali-monastery',
  'watchpoint-gibraltar',
  'aatlis',
  'new-junk-city',
  'suravasa',
  'blizzard-world',
  'eichenwalde',
  'hollywood',
  'kings-row',
  'midtown',
  'numbani',
  'paraiso',
  'colosseo',
  'esperanca',
  'new-queen-street',
  'runasapi',
] as const
export type OWMap = (typeof MAPS)[number]
export const DEFAULT_MAP: OWMap = "all-maps"

export const QUICKPLAY_MAPS = [
  ...MAPS,
] as const
export type OWQuickplayMap = (typeof QUICKPLAY_MAPS)[number]
export const DEFAULT_QUICKPLAY_MAP: OWQuickplayMap = DEFAULT_MAP

export const REGIONS = ['Americas', 'Europe', 'Asia'] as const
export type OWRegion = (typeof REGIONS)[number]
export const DEFAULT_REGION: OWRegion = "Americas"

export const INPUTS = ['PC', 'Console'] as const
export type OWInput = (typeof INPUTS)[number]
export const DEFAULT_INPUT: OWInput = "PC"