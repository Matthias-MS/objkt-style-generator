import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: "Keine Adresse übermittelt" });
  }

  try {
    // Objkt Künstlerseite
    const url = `https://objkt.com/users/${address}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Objkt-Seite nicht erreichbar");

    const html = await response.text();

    // Mit JSDOM parsen
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Alle NFTs aus "Created" sammeln
    const createdSection = Array.from(
      document.querySelectorAll("div[id^='created'] a[href*='/objkt/']")
    );

    if (createdSection.length === 0) {
      return res.status(404).json({ error: "Keine NFT-Bilder gefunden (Created leer)" });
    }

    // Bild-URLs und Metadata extrahieren
    const tokens = createdSection.map((a) => {
      const img = a.querySelector("img");
      return {
        name: img?.alt || "NFT",
        image: img?.src || null,
      };
    }).filter(t => t.image); // nur mit gültigem Bild

    if (tokens.length === 0) {
      return res.status(404).json({ error: "Keine NFT-Bilder gefunden" });
    }

    res.status(200).json({ tokens });

  } catch (err) {
    console.error("Objkt Webscraping Fehler:", err);
    res.status(500).json({ error: "Keine NFT-Bilder gefunden oder API nicht erreichbar" });
  }
}

