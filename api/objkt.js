import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Adresse fehlt" });
  }

  try {
    const url = `https://objkt.com/users/${address}?tab=created`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      throw new Error("Objkt-Seite konnte nicht geladen werden");
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const tokens = [];

    // Suche alle Bilder innerhalb von NFT-Karten
    const images = document.querySelectorAll("img");

    images.forEach(img => {
      const src = img.src;

      if (!src) return;

      // Nur echte NFT-Bilder von Objkt CDN
      if (
        src.includes("ipfs") ||
        src.includes("objkt") ||
        src.includes("cloudflare-ipfs")
      ) {
        tokens.push({
          name: img.alt || "",
          image: src,
          description: img.alt || ""
        });
      }
    });

    // Duplikate entfernen
    const uniqueTokens = Array.from(
      new Map(tokens.map(t => [t.image, t])).values()
    );

    if (!uniqueTokens.length) {
      return res.status(200).json({ tokens: [] });
    }

    return res.status(200).json({ tokens: uniqueTokens });

  } catch (error) {
    console.error("Scraping Fehler:", error);
    return res.status(500).json({ error: "Objkt Webscraping fehlgeschlagen" });
  }
}

