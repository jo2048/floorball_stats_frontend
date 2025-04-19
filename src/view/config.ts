
interface CountryConfig {
    baseUrl: string,
    title: string,
    originalSiteUrl: string,
    originalSiteName: string
}

const CONFIGS: Record<string, CountryConfig> = {
    "BELGIUM": {
        baseUrl: "https://www.floorballbelgium.be/api/",
        title: "Belgian floorball statistics",
        originalSiteUrl: "https://www.floorballbelgium.be/",
        originalSiteName: "the BFF official site" 
    },
    "FRANCE": {
        baseUrl: "https://visu.floorball.fr/api/",
        title: "French floorball statistics",
        originalSiteUrl: "https://visu.floorball.fr/fr",
        originalSiteName: "visu.floorball.fr"
    },
    "DEV": {
        baseUrl: "http://127.0.0.1:5000/caching/",
        title: "Belgian floorball statistics",
        originalSiteUrl: "https://www.floorballbelgium.be/",
        originalSiteName: "the BFF official site" 
    }
}

declare const __COUNTRY__: string;

class Config {
    static instance: CountryConfig = null

    static getInstance() {
        if (!this.instance)
            this.instance = CONFIGS[__COUNTRY__]
        return this.instance
    }
}

export { Config }