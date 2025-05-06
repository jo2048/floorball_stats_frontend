interface CountryConfig {
  baseUrl: string;
  title: string;
  originalSiteUrl: string;
  originalSiteName: string;
}

const CONFIGS: Record<string, CountryConfig> = {
  BELGIUM: {
    baseUrl: "https://www.floorballbelgium.be/api/",
    title: "Belgian floorball statistics",
    originalSiteUrl: "https://www.floorballbelgium.be/",
    originalSiteName: "BFF official website",
  },
  FRANCE: {
    baseUrl: "https://visu.floorball.fr/api/",
    title: "French floorball statistics",
    originalSiteUrl: "https://visu.floorball.fr/fr",
    originalSiteName: "visu.floorball.fr",
  },
  DEV: {
    baseUrl: "http://127.0.0.1:5000/caching/",
    title: "Belgian floorball statistics",
    originalSiteUrl: "https://www.floorballbelgium.be/",
    originalSiteName: "BFF official website",
  },
};

const COLORS: { [key: string]: string } = {
  "Games played": "rgba(54, 162, 235, 0.5)",
  Goals: "rgba(7, 130, 7, 0.5)",
  Assists: "rgba(230, 197, 12, 0.5)",
  Faults: "rgba(236, 2, 2, 0.5)",
  Won: "rgba(7, 130, 7, 0.5)",
  Lost: "rgba(236, 10, 10, 0.5)",
  Tie: "rgba(54, 162, 235, 0.5)",
  "Goals not involved": "rgba(54, 162, 235, 0.5)",
  "Goals conceded": "rgba(236, 10, 10, 0.5)",
};

declare const __COUNTRY__: string;

class Config {
  static instance: CountryConfig = null;

  static getInstance() {
    if (!this.instance) this.instance = CONFIGS[__COUNTRY__];
    return this.instance;
  }
}

export { Config, COLORS };
