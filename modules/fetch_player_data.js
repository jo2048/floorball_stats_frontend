import { Config } from "./config.js";

async function searchPlayerByName(playerName) {
  const url = Config.getBaseUrl() + "public_players_get.php";
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
  } catch (error) {
    console.error(`Error fetching player data: ${error.message}`);
    return [500, null];
  }
}

// command = get or match
async function fetchPlayerData(playerId, command) {
  if (!playerId)
    throw new Error(
      "Invalid argument to fetch playerData : playerId = ",
      playerId
    );
  const url = Config.getBaseUrl() + "public_players_get.php";
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
  } catch (error) {
    console.error(`Error fetching player data: ${error.message}`);
    return [500, null];
  }
}

async function fetchTeamPlayers(teamId) {
  if (!teamId)
    throw new Error("Invalid argument to fetch playerData : teamId = ", teamId);
  const url = Config.getBaseUrl() + "public_players_get.php";
  const payload = { id: parseInt(teamId), command: "team" };
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
  } catch (error) {
    console.error(`Error fetching player data: ${error.message}`);
    return [500, null];
  }
}

export { searchPlayerByName, fetchPlayerData, fetchTeamPlayers };
