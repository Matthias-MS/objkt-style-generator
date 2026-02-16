import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Keine Adresse übermittelt" });

  const url = `https://objkt.com/users/${address}/created`;

  try {
    // Seite abrufen
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: "Objkt Seite nicht erreichbar." });

    const html = await response.text();

    // HTML parsen
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Alle NFTs im "Created"-Tab finden
    const items = [...document.querySelectorAll("script[type='application/ld+json']")];

    let tokens = [];
    for (let script of items) {
      try {
        const data = JSON.parse(script.textContent);
        if (data["@type"] === "Product") {
          tokens.push({
            name: data.name,
            description: data.description,
            image: data.image
          });
        }
      } catch {}
    }

    if (tokens.length === 0) {
      return res.status(404).json({ error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab." });
    }

    res.status(200).json({ tokens });
  } catch (e) {
    res.status(500).json({ error: "Fehler beim Abrufen der NFTs: " + e.message });
  }
}
