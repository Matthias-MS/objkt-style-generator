export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: "Keine Adresse übermittelt" });
  }

  try {
    // TzKT: Nur Tokens, die vom Artist erstellt wurden
    const url = `https://api.tzkt.io/v1/tokens?creator=${address}&limit=100`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ error: "TzKT API nicht erreichbar. Bitte später erneut versuchen." });
    }

    const tokens = await response.json();

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(404).json({ error: "Keine Tokens gefunden." });
    }

    // IPFS in HTTP umwandeln
    function ipfsToHttp(uri) {
      if (!uri) return null;
      if (uri.startsWith("ipfs://")) {
        return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
      return uri;
    }

    const createdNFTs = tokens
      .filter(t => t.metadata)
      .map(t => {
        const image =
          ipfsToHttp(t.metadata.displayUri) ||
          ipfsToHttp(t.metadata.artifactUri) ||
          ipfsToHttp(t.metadata.thumbnailUri);

        if (!image) return null;

        return {
          name: t.metadata.name || "",
          description: t.metadata.description || "",
          image,
          tags: Array.isArray(t.metadata.tags) ? t.metadata.tags : []
        };
      })
      .filter(Boolean);

    if (createdNFTs.length === 0) {
      return res.status(404).json({
        error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Metadaten fehlen."
      });
    }

    return res.status(200).json({ tokens: createdNFTs });

  } catch (e) {
    return res.status(500).json({
      error: "Fehler beim Abrufen der NFTs: " + e.message
    });
  }
}

