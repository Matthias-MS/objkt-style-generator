import fetch from "node-fetch"; // falls Node.js <18

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    const url = `https://objkt.com/users/${address}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: "Objkt Profil nicht erreichbar" });

    const html = await response.text();

    // Nur Created NFTs auslesen
    // Suche nach JSON in HTML, das NFT-Infos enthält
    const createdMatch = html.match(/"created":(\[.*?\]),"owned"/s);
    if (!createdMatch) return res.status(404).json({ error: "Keine Created NFTs gefunden." });

    let tokens = [];
    try {
      tokens = JSON.parse(createdMatch[1]);
    } catch (err) {
      return res.status(500).json({ error: "NFT-Daten konnten nicht geparsed werden." });
    }

    // Filter: nur Objekte mit Bild-URL
    tokens = tokens.filter(t => t.metadata?.displayUri || t.metadata?.artifactUri || t.image);

    if (!tokens.length) return res.status(404).json({ error: "Keine NFT-Bilder gefunden." });

    res.status(200).json({ tokens });
  } catch (err) {
    console.error("API Fehler:", err);
    res.status(500).json({ error: "Unerwarteter Fehler im Server: " + err.message });
  }
}

