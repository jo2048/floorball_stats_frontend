import { ClubRegistry } from "./club"

type TeamCategory = "U10" | "U13" | "U16" | "U19" | "Adults"

class Team {
  static register: Map<number, Team> = new Map()

  constructor(readonly id: number, readonly category: TeamCategory, readonly clubId: number, readonly name: string) {
    Team.register.set(this.id, this)
  }

  getNameFormatted() {
    return `${this.name} (${this.category})`
  }

  getColor(): string | null {
    return ClubRegistry.getClubById(this.clubId)?.colorhome1
  }

  static getTeamById(teamId: number) {
    if (!this.register.has(teamId))
      throw new Error("No team with id = " + teamId)
    return this.register.get(teamId)
  }
}

export { Team }