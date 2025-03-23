
class Config {
    static country = "BELGIUM"
    // static country = "FRANCE"

    // static setCountry(country) {
    //     if (!["BELGIUM", "FRANCE"].contains(country))
    //         throw new Error("Unsupported country : " + country)
    //     this.country = country
    // }

    static getBaseUrl() {
        return this.country === "BELGIUM" ? "https://www.floorballbelgium.be/api/" : "https://visu.floorball.fr/api/"
    }
    
}

export { Config }