export type Faction = "elyos" | "asmodien";

export interface ServerPair {
  elyos: string;
  asmodien: string;
  /** "anticipe" = ouvert pendant l'accès anticipé (Founder's Pack), "f2p" = ouvert au lancement F2P */
  wave: "anticipe" | "f2p";
}

/**
 * Serveurs EU au 10/10/2026 (source : Mein-MMO, 05/10/2026).
 * Les paires F2P ne sont pas publiées officiellement : seuls les noms par faction sont fiables.
 * MetaBot compte 46 serveurs EU au 16/10 : une deuxième vague a probablement ouvert depuis.
 */
export const EU_SERVERS = {
  updated: "2026-10-10",
  note: "MetaBot recense 46 serveurs EU au 16/10/2026 : une deuxième vague a ouvert depuis ce relevé.",
  anticipe: {
    elyos: ["Ariel", "Siel", "Kaisinel"],
    asmodien: ["Israphel", "Marchutan", "Beritra"],
    incomplete: true,
  },
  f2p: {
    elyos: ["Nania", "Tahavatha", "Luteros", "Phernos", "Daminu", "Kasaka", "Bakarma", "Tsenka", "Kochi"],
    asmodien: ["Hadala", "Ludra", "Ulgorn", "Munin", "Odar", "Zemurru", "Kromede", "Quai", "Baba"],
    incomplete: false,
  },
} as const;
