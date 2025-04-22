import { fetchPlayerData } from "./fetch_player_data.js";
import { Tournament } from "./tournament.js";
import { Season } from "./season.js";
import { Player } from "./player.js";

type CompetitionLevel = "SEASON" | "TOURNAMENT"
type GameOutcome =  "TIE" | "WON" | "LOST"

class Game {
  readonly id: number
  readonly roundId: number
  readonly isPlayed: boolean
  readonly teamAwayId: number
  readonly teamHomeId: number
  readonly scoreHome: number;
  readonly scoreAway: number;
  readonly sporthallId: number;
  readonly date: Date;
  readonly time: string;

  constructor(data: any, readonly tournament: Tournament) {
    this.id = data["id"];
    this.roundId = data["round_id"];
    this.isPlayed = data["is_played"];
    this.teamAwayId = data["team_away_id"];
    this.teamHomeId = data["team_home_id"];
    this.scoreHome = data["score_home"];
    this.scoreAway = data["score_away"];
    this.sporthallId = data["sporthall_id"];
    this.date = new Date(data["date"]);
    this.time = data["time"];
  }

  getSeason(): Season {
    if (this.tournament.id && this.tournament.id >= 0)
      return this.tournament.season
    else
      return Season.findSeasonByDate(this.date)
  }
}

class PlayerGame extends Game {
  playerId: number;
  playerTeamId: number;
  playerGoals: number;
  playerAssists: number;
  playerFaults: number;
  playerMvp: number;
  playerNumber: number;
  constructor(data: any, tournament: Tournament) {
    super(data, tournament);
    this.playerId = data["player"]["id"];
    this.playerTeamId = data["player"]["teamid"];
    this.playerGoals = data["player"]["goal"];
    this.playerAssists = data["player"]["assist"];
    this.playerFaults = data["player"]["fault"];
    this.playerMvp = data["player"]["mvp"];
    this.playerNumber = data["player"]["number"];
  }

  isWon(): GameOutcome {
    if (this.scoreHome === this.scoreAway) return "TIE";

    const isHome = this.playerTeamId === this.teamHomeId;
    const homeWon = this.scoreHome > this.scoreAway;

    return (homeWon && isHome) || (!homeWon && !isHome) ? "WON" : "LOST";
  }

  getGoalsByTeam() {
    const isHome = this.playerTeamId === this.teamHomeId;
    return isHome ? this.scoreHome : this.scoreAway;
  }

  getGoalsConceded() {
    const isHome = this.playerTeamId === this.teamHomeId;
    return isHome ? this.scoreAway : this.scoreHome;
  }

  static async createFromData(data: any) {
    const tournament = await Tournament.getTournamentById(data["competition_id"])
    return new PlayerGame(data, tournament)
  }
}

function uniqBy<T>(a: Array<T>, key: any): Array<T> {
  return [
      ...new Map(
          a.map((x: any) => [key(x), x])
      ).values()
  ]
}

interface Stats {
  gamesPlayed: number,
  goals: number,
  assists: number,
  faults: number,
  won: number
  tie: number
  lost: number
  goalsByTeam: number,
  goalsConceded: number,
  participationRateInGoals: number
}

class GameCollection {
  private static gamesByPlayerCache: Map<number, Array<PlayerGame>> = new Map() 

  constructor(readonly player: Player, readonly games: Array<PlayerGame>) {}

  getStatsGroupedBy(competitionLevel: CompetitionLevel) {
    const groups = this.groupGamesBy(competitionLevel)
    return Array.from(groups.entries()).map(([k, v]) => [k, new GameCollection(this.player, v).computeStats()])
  }

  computeStats(): Stats {
    const goals = this.getGoalsCount()
    const assists = this.getAssistsCount()
    const goalsByTeam = this.getGoalsByTeamCount()
    const wonTieLostCount = this.getWonTieLostCount()
    return {
      gamesPlayed: this.getGamesPlayedCount(),
      goals: this.getGoalsCount(),
      assists: this.getAssistsCount(),
      faults:  this.getFaultsCount(),
      won: wonTieLostCount.get("WON"),
      tie: wonTieLostCount.get("TIE"),
      lost: wonTieLostCount.get("LOST"),
      goalsByTeam: goalsByTeam,
      goalsConceded: this.getGoalsConcededCount(),
      participationRateInGoals: goalsByTeam == 0 ? 0 : (goals + assists) / goalsByTeam
    }
  }

  filterOnSeason(season: Season): GameCollection {
    return new GameCollection(this.player, Array.from(this.games.filter(g => g.getSeason() == season)))
  }

  getDistinctSeasons(): Set<Season> {
    return new Set(this.games.map(g => g.getSeason()))
  }

  groupGamesBy(competitionLevel: CompetitionLevel) {
    const groupingFunction = competitionLevel == "SEASON" ? (game: Game) => game.getSeason() : (game: Game) => game.tournament
    const groups = new Map()
    for (const game of this.games) {
      const groupingKey = groupingFunction(game)
      if (!groups.has(groupingKey))
        groups.set(groupingKey, [])
      groups.get(groupingKey).push(game)
    }
    return groups
  }

  getGoalsCount() {
    return this.games.reduce((sum, g) => sum + g.playerGoals, 0);
  }

  getAssistsCount() {
    return this.games.reduce((sum, g) => sum + g.playerAssists, 0);
  }

  getGamesPlayedCount() {
    return this.games.filter((g) => g.isPlayed).length;
  }

  getFaultsCount() {
    return this.games.reduce((sum, g) => sum + g.playerFaults, 0);
  }

  getGoalsConcededCount() {
    return this.games.reduce((sum, g) => sum + g.getGoalsConceded(), 0);
  }

  getGoalsByTeamCount() {
    return this.games.reduce((sum, g) => sum + g.getGoalsByTeam(), 0);
  }

  getWonTieLostCount() {
    const count: Map<GameOutcome, number> = new Map([
      ["WON", 0],
      ["TIE", 0],
      ["LOST", 0],
    ]);
    this.games.forEach(g => count.set(g.isWon(), count.get(g.isWon()) + 1));
    return count;
  }

  static async loadPlayerGameCollection(player:Player) {
    if (!this.gamesByPlayerCache.has(player.id)) {
      const [, matches] = await fetchPlayerData(player.id, "match")
      const games = await Promise.all(matches.list_match.map(async (data: any) => await PlayerGame.createFromData(data)))
      this.gamesByPlayerCache.set(player.id, uniqBy(games, (g: Game) => g.id))
    }
    return new GameCollection(player, this.gamesByPlayerCache.get(player.id)) 
  }
}

export { PlayerGame, GameCollection as GameCollection, GameOutcome, CompetitionLevel, Stats };
