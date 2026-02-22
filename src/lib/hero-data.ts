export type HeroData = {
  id: string
  cells: {
    name: string
    pickrate: number
    winrate: number
  }
  hero: {
    color: string
    name: string
    portrait: string
    role: string
    roleIcon: string
  }
}
