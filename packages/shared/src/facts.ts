export interface Fact {
  label: string;
  value: string;
  /** Date du relevé (ISO) */
  asOf: string;
  source: { name: string; url: string };
}

/** Repères EU affichés sur l'accueil. Chaque valeur est datée et sourcée. */
export const EU_FACTS: Fact[] = [
  {
    label: "Lancement global",
    value: "5 octobre 2026, free-to-play",
    asOf: "2026-10-10",
    source: { name: "aion2hub", url: "https://aion2hub.com/guides/aion-2-release-date" },
  },
  {
    label: "Serveurs EU",
    value: "46 (23 par faction)",
    asOf: "2026-10-16",
    source: { name: "MetaBot", url: "https://metabot.gg/en/aion-2/servers" },
  },
  {
    label: "Marché",
    value: "Limité à ton serveur",
    asOf: "2026-10-10",
    source: {
      name: "Mein-MMO",
      url: "https://mein-mmo.de/en/aion-2-servers-for-europe-all-info-on-launch-matchmaking-transfer-and-market,1590045/",
    },
  },
  {
    label: "Vendre au marché",
    value: "Abonnement requis, 14,99 $ par mois",
    asOf: "2026-10-11",
    source: { name: "senseos.gg", url: "https://senseos.gg/guides/aion-2/prices-membership-daeva-pass/" },
  },
  {
    label: "Échange entre joueurs",
    value: "Désactivé en global",
    asOf: "2026-10-10",
    source: {
      name: "Mein-MMO",
      url: "https://mein-mmo.de/en/aion-2-servers-for-europe-all-info-on-launch-matchmaking-transfer-and-market,1590045/",
    },
  },
  {
    label: "Raid à 10 joueurs",
    value: "Retiré temporairement le 7 octobre",
    asOf: "2026-10-10",
    source: {
      name: "Mein-MMO",
      url: "https://mein-mmo.de/en/aion-2-server-down-everything-about-status-time-patch-notes-and-more-on-the-server-maintenance-on-october-7-in-the-live-ticker,1591220/",
    },
  },
];
