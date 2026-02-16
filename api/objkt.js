import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address)
    return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    // Artist-Seite laden
    const url = `https://objkt.com/users/${address}`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error("Objkt-Seite nicht erreichbar");

    const html = await response.text();

    // DOM parsen
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // "Created"-Section finden
    const createdSection = [...document.querySelectorAll("section")]
      .find(s => s.textContent.includes("Created"));
    if (!createdSection) throw new Error("Keine Created-Sektion gefunden");

    // Alle NFT-Items innerhalb der Created-Sektion extrahieren
    const nftItems = [...createdSection.querySelectorAll("a")]
      .filter(a => a.href.includes("/objkt/")); // Filter: Links zu NFTs

    if (nftItems.length === 0)
      throw new Error("Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab.");

    const tokens = nftItems.map(a => {
      const img = a.querySelector("img");
      const nameEl = a.querySelector(".nft-name"); // falls Objkt Name-Klasse
      const descEl = a.querySelector(".nft-description"); // falls Objkt Description-Klasse

      return {
        name: nameEl ? nameEl.textContent.trim() : `NFT #${a.href.split("/").pop()}`,
        description: descEl ? descEl.textContent.trim() : "",
        image: img ? img.src : null
      };
    }).filter(t => t.image); // nur NFTs mit Bild-URL

    res.status(200).json({ tokens });
  } catch (e) {
    console.error("Objkt Webscraper Fehler:", e.message);
    res.status(500).json({ error: "Objkt API nicht erreichbar. Bitte später erneut versuchen." });
  }
}

