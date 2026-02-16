export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    // TzKT API: alle NFTs created vom Künstler
    const url = `https://api.tzkt.io/v1/tokens?creator=${address}&limit=50`;

    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: "TzKT API nicht erreichbar. Bitte später erneut versuchen." });

    const tokens = await response.json();

    // Filter nur NFTs mit gültigem Bild
    const createdNFTs = tokens
      .filter(t => t.metadata && (t.metadata.displayUri || t.metadata.artifactUri || t.metadata.thumbnailUri))
      .map(t => ({
        name: t.metadata.name || "",
        description: t.metadata.description || "",
        image: t.metadata.displayUri || t.metadata.artifactUri || t.metadata.thumbnailUri,
        tags: t.metadata.tags || []
      }));

    if (!createdNFTs.length) return res.status(404).json({ error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab." });

    res.status(200).json({ tokens: createdNFTs });
  } catch (e) {
    res.status(500).json({ error: "Fehler beim Abrufen der NFTs: " + e.message });
  }
}
