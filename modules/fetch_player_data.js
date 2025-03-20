async function searchPlayerByName(playerName) {
    const url = "https://www.floorballbelgium.be/api/public_players_get.php";
    const payload = {text:playerName,command:"search"};
    try {
      const response = await fetch (url, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          throw new Error(`Response status: ${response.status} for playerId= ${playerName}`);
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
      throw new Error("Invalid argument to fetch playerData : playerId = ", playerId)
    const url = "https://www.floorballbelgium.be/api/public_players_get.php";
    const payload = { id: playerId, command: command };
    try {
      const response = await fetch (url, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          throw new Error(`Response status: ${response.status} for playerId= ${playerId}`);
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
  
  async function fetchTeamPlayers(teamId, seasonId) {
    const url = "https://www.floorballbelgium.be/api/public_players_get.php";
    const payload = { id: parseInt(teamId), command: "club", season: parseInt(seasonId) };
    try {
        const response = await post(url, payload, { timeout: 5000 });
        if (response.status === 400) {
            return null;
        }
        return response.data;
    } catch (error) {
        console.error(`Error fetching team players: ${error.message}`);
        return null;
    }
  }


export { searchPlayerByName, fetchPlayerData }