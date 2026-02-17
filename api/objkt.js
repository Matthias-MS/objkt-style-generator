// api/objkt.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Keine Adresse angegeben" });
    }

    // TzKT API: NFTs created by user
    const url = `https://api.tzkt.io/v1/tokens/balances?account=${address}&token.metadata.artifactUri.null=false&balance.gt=0&select=token`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("TzKT Indexer nicht erreichbar");

    const tokensRaw = await response.json();

    // Filter: nur Created NFTs, keine Kollektionen, keine Tokens ohne Bild
    const tokens = tokensRaw
      .map(t => t.token)
      .filter(t => t.creator?.address === address) // created only
      .filter(t => t.metadata && (t.metadata.displayUri || t.metadata.artifactUri));

    if (tokens.length === 0) {
      return res.status(200).json({ tokens: [] });
    }

    res.status(200).json({ tokens });
  } catch (err) {
    console.error("Objkt API Fehler:", err);
    res.status(500).json({ error: "Keine NFT-Bilder gefunden oder API nicht erreichbar." });
  }
}


