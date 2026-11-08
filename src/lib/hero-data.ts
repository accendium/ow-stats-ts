export type HeroData = {
  id: string
  cells: {
    name: string
    pickrate: number
    winrate: number
    /** Present since the 2026-07 API change (competitive role queue) */
    banrate?: number
  }
  hero: {
    color: string
    name: string
    portrait: string
    role: string
    roleIcon: string
    /** Present since the 2026-07 API change, e.g. "tactician" */
    subrole?: string
  }
}
