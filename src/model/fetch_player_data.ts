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

async function fetchTeamPlayers(teamId: number) {
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

async function fetchGamePlayers(gameId: number): Promise<[number, Array<GetGamePlayerResult>]> {
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

interface GetGamePlayerResult {
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

async function getGamePlayers(gameId: number): Promise<Array<number>> {
  const data = await fetchGamePlayers(gameId)
  return data[1].map((elt: any) => elt.id)
}

async function getGamePlayersFilteredByTeam(playerId:number, gameId: number, sameTeam=true): Promise<Array<number>> {
  const data = await fetchGamePlayers(gameId)
  const playerArray = data[1]
  const teamId = playerArray.find((p: any) => p.id == playerId).teamid
  return playerArray.filter(p => sameTeam ? p.teamid == teamId : p.teamid != teamId).map(p => p.id)
}

export { searchPlayerByName, fetchPlayerData, fetchTeamPlayers, getGamePlayers, getGamePlayersFilteredByTeam };
