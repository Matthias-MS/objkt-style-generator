// /api/objkt.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  try {
    const { address } = req.body;
    if (!address || (!address.startsWith("tz") && !address.startsWith("KT"))) {
      return res.status(400).json({ error: "Ungültige Adresse" });
    }

    // TzKT Indexer API - nur Created NFTs (creator = address)
    const url = `https://api.tzkt.io/v1/tokens/balances?account=${address}&token.standard=fa2&balance.gt=0&limit=1000`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("TzKT API nicht erreichbar");

    const balances = await response.json();

    // Nur NFTs, bei denen der creator die Adresse ist
    const createdNFTs = balances
      .filter(b => b.token?.metadata && b.token?.creator === address)
      .map(b => ({
        name: b.token.metadata.name || "",
        description: b.token.metadata.description || "",
        image: b.token.metadata.displayUri || b.token.metadata.artifactUri || "",
        tags: b.token.metadata.tags || [],
      }))
      .filter(t => t.image); // nur mit Bild-URL

    if (createdNFTs.length === 0) {
      return res.status(200).json({ tokens: [] });
    }

    return res.status(200).json({ tokens: createdNFTs });
  } catch (err) {
    console.error("Objkt API Fehler:", err);
    return res.status(500).json({ error: "Keine NFT-Bilder gefunden oder API nicht erreichbar." });
  }
}
