
const BASE_URLS = {
    "BELGIUM": "https://www.floorballbelgium.be/api/",
    "FRANCE": "https://visu.floorball.fr/api/"
}

class Config {
    static country = "BELGIUM"
    // static country = "FRANCE"

    static getBaseUrl(): string {
        return "https://www.floorballbelgium.be/api/"
    }
    
}

export { Config }