// api/objkt.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    // 1. Alle "Created" NFTs vom TzKT REST API Endpoint abrufen
    // Limit auf 50 (du kannst höher setzen, wenn nötig)
    const url = `https://api.tzkt.io/v1/tokens/balances?account=${address}&token.standard=fa2&balance.gt=0&limit=50`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: "TzKT API nicht erreichbar. Bitte später erneut versuchen." });
    }

    const data = await response.json();

    // 2. Nur Tokens herausfiltern, die der Adresse gehören UND created wurden
    // TzKT liefert 'token.metadata' und 'token.contract.address' usw.
    const tokens = data
      .filter(item => item.token?.creator?.address === address) // nur vom Artist erstellte NFTs
      .map(item => ({
        name: item.token?.metadata?.name || "",
        description: item.token?.metadata?.description || "",
        image: item.token?.metadata?.displayUri || item.token?.metadata?.artifactUri || "",
        metadata: item.token?.metadata || {}
      }));

    if (!tokens.length) {
      return res.status(404).json({ error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab." });
    }

    // 3. Erfolgreich zurückgeben
    return res.status(200).json({ tokens });

  } catch (err) {
    console.error("objkt.js Fehler:", err);
    return res.status(500).json({ error: "Unerwarteter Fehler bei der NFT-Abfrage." });
  }
}
