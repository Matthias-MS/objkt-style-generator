import fetch from "node-fetch"; // falls Node 18+, fetch ist global verfügbar, sonst import

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    // 1. Hole die Seite des Artists
    const profileUrl = `https://objkt.com/users/${address}`;
    const htmlResponse = await fetch(profileUrl);
    if (!htmlResponse.ok) return res.status(502).json({ error: "Objkt-Seite nicht erreichbar" });

    const html = await htmlResponse.text();

    // 2. Suche nach JSON-Daten für die „Created“ NFTs
    const match = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});/s);
    if (!match) return res.status(404).json({ error: "Keine Daten von Objkt erhalten." });

    const stateJson = JSON.parse(match[1]);

    // 3. Extrahiere nur „Created“ NFTs
    let createdTokens = [];
    if (stateJson.user && stateJson.user.collections) {
      for (const col of stateJson.user.collections) {
        if (col.tokens && Array.isArray(col.tokens)) {
          createdTokens = createdTokens.concat(col.tokens);
        }
      }
    }

    if (!createdTokens.length) return res.status(404).json({ error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab." });

    // 4. Optional: nur relevante Felder zurückgeben
    const tokens = createdTokens.map(t => ({
      name: t.name || "",
      description: t.description || "",
      image: t.displayUri || t.artifactUri || "",
      metadata: t.metadata || {},
      tags: t.tags || []
    }));

    return res.status(200).json({ tokens });

  } catch (e) {
    console.error("API Fehler:", e);
    return res.status(500).json({ error: "Objkt API konnte nicht erreicht werden: " + e.message });
  }
}

