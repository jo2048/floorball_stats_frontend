import { Config } from "../view/config.js";

async function searchPlayerByName(playerName: string) {
  const url = Config.getInstance().baseUrl + "public_players_get.php";
  const payload = { text: playerName, command: "search" };
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(
        `Response status: ${response.status} for playerId= ${playerName}`
      );
    }
    const json = await response.json();
    for (const player of json) {
      delete player.list_logo;
      delete player.clublogo;
      delete player.photo;
    }
    return [response.status, json];
  } catch (error: any) {
    console.error(`Error fetching player data: ${error.message}`);
    return [500, null];
  }
}

// command = get or match
async function fetchPlayerData(playerId: number, command: string) {
  const url = Config.getInstance().baseUrl + "public_players_get.php";
  const payload = { id: playerId, command: command };
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(
        `Response status: ${response.status} for playerId= ${playerId}`
      );
    }
    const json = await response.json();
    delete json.list_logo;
    delete json.clublogo;
    delete json.photo;
    return [response.status, json];
  } catch (error: any) {
    console.error(`Error fetching player data: ${error.message}`);
    return [500, null];
  }
}



const teamPlayersCache: Map<number, any> = new Map()

async function getTeamPlayers(teamId: number): Promise<any> {
  if (!teamPlayersCache.has(teamId)) {
    const players = await fetchTeamPlayers(teamId)
    teamPlayersCache.set(teamId, players[1])
  }
  return teamPlayersCache.get(teamId)
}

async function fetchTeamPlayers(teamId: number): Promise<[number, any]> {
  const url = Config.getInstance().baseUrl + "public_players_get.php";
  const payload = { id: teamId, command: "team" };
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(
        `Response status: ${response.status} for teamId= ${teamId}`
      );
    }
    const json = await response.json();
    delete json.list_logo;
    delete json.clublogo;
    delete json.photo;
    return [response.status, json];
  } catch (error: any) {
    console.error(`Error fetching player data: ${error.message}`);
    return [500, null];
  }
}

async function fetchGamePlayers(gameId: number): Promise<[number, Array<GetGamePlayersResult>]> {
  const url = Config.getInstance().baseUrl + "public_mt_match_get.php";
  const payload = { id: gameId, command: "player", old: true };
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(
        `Response status: ${response.status} for gameId = ${gameId}`
      );
    }
    const json = await response.json();
    return [response.status, json];
  } catch (error: any) {
    console.error(`Error fetching player data: ${error.message}`);
    return [500, null];
  }
}


interface GetGamePlayersResult {
  "assist": number,
  "fault": number,
  "firstname": string,
  "goal": number,
  "goal_conceed": boolean,
  "has_fullstats": boolean,
  "has_stats": any,
  "id": number,
  "iscaptain": number,
  "isgoalkeeper": number,
  "isprivate": number,
  "lastname": string,
  "matchid": number,
  "mvp": number,
  "number": number,
  "pc_saves"?: null,
  "photo": string,
  "saves"?: number,
  "sex": string,
  "teamid": number
}

function gamePlayerResultToGameParticipation(gamePlayerResult: GetGamePlayersResult): GameParticipation {
  return {
    playerId: gamePlayerResult.id,
    teamId: gamePlayerResult.teamid
  }
}

const gameParticipationCache: Map<number, Array<GameParticipation>> = new Map()

async function getGamePlayersFilteredByTeam(gameId: number, playerId:number, sameTeam=true) {
  if (!gameParticipationCache.has(gameId)) {
    const data = await fetchGamePlayers(gameId)
    const playerArray = data[1].map(gamePlayerResultToGameParticipation)
    gameParticipationCache.set(gameId, playerArray)
  }
  const participationArray = gameParticipationCache.get(gameId)
  const teamId = participationArray.find(p => p.playerId == playerId).teamId
  return participationArray.filter(p => sameTeam ? p.teamId == teamId : p.teamId != teamId).map(p => p.playerId)
}

export { searchPlayerByName, fetchPlayerData, getTeamPlayers, getGamePlayersFilteredByTeam };
