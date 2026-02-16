import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    // TzKT API: Nur selbst erstellte NFTs
    const url = `https://api.tzkt.io/v1/tokens/balances?account=${address}&token.standard=fa2&token.creators=${address}&limit=50`;

    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: "Objkt/TzKT API nicht erreichbar" });

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab." });
    }

    // Relevante Infos extrahieren
    const tokens = data
      .map(item => ({
        name: item.token.metadata?.name || "",
        description: item.token.metadata?.description || "",
        tags: item.token.metadata?.tags || [],
        image: item.token.metadata?.displayUri || item.token.metadata?.artifactUri || ""
      }))
      .filter(t => t.image); // Nur NFTs mit Bild-URL

    if (tokens.length === 0) {
      return res.status(404).json({ error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab." });
    }

    res.status(200).json({ tokens });

  } catch (e) {
    res.status(500).json({ error: "Serverfehler: " + e.message });
  }
}
