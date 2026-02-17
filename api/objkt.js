export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address)
    return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    // Anfrage an TzKT: alle Tokens, bei denen address im Creator‑Feld steht
    const url = `https://api.tzkt.io/v1/tokens?token.metadata.creators.[*]=${address}&select=contract,tokenId,metadata`;
    const response = await fetch(url);

    if (!response.ok)
      return res
        .status(502)
        .json({ error: "Objkt Indexer API nicht erreichbar." });

    const tokens = await response.json();

    // keine gefunden?
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res
        .status(404)
        .json({ error: "Keine NFT‑Tokens gefunden für diese Artist‑Adresse." });
    }

    // Rückgabe an Frontend
    return res.status(200).json({ tokens });
  } catch (e) {
    console.error("API Handler Error:", e);
    return res
      .status(500)
      .json({ error: "Interner Serverfehler beim Abruf der NFTs." });
  }
}
