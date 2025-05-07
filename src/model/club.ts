
class ClubRegistry {

  static clubCache: Map<number, Club> = new Map()

  static getOrRegisterClub(clubData: Club): Club {
    if (!this.clubCache.has(clubData.id)) {
      clubData.getNameFormatted = () => { return clubData.name }
      clubData.halls.forEach(hall => HallRegistry.getOrRegisterSporthall(hall))
      this.clubCache.set(clubData.id, clubData)
    }
    return this.clubCache.get(clubData.id)
  }
}

class HallRegistry {
  static cache: Map<number, SportHall> = new Map()

  static getOrRegisterSporthall(data: SportHall): SportHall {
    if (!this.cache.has(data.id)) {
      this.cache.set(data.id, data)
    }
    return this.cache.get(data.id)
  }

  static getSporthallById(sportHallId: number): SportHall {
    if (!this.cache.has(sportHallId)) {
      return {
        id: sportHallId,
        city: "No data",
        name: "No data",
        postcode: 0,
        streetaddress: "No data"
      }
    }
    return this.cache.get(sportHallId)
  }
}

export { ClubRegistry, HallRegistry }