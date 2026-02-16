import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address)
    return res.status(400).json({ error: "Keine Adresse übermittelt" });

  try {
    // URL zur Created-Seite des Künstlers
    const url = `https://objkt.com/users/${address}?tab=created`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok)
      return res
        .status(502)
        .json({ error: "Objkt Seite nicht erreichbar. Bitte später erneut." });

    const html = await response.text();

    // Parse HTML via JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Alle NFT-Cards finden (nur Created)
    const nftCards = document.querySelectorAll(
      'div.sc-gqjmRU > a[href^="/objkt/"]'
    );

    if (!nftCards || nftCards.length === 0)
      return res.status(404).json({
        error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab.",
      });

    // Extrahiere Bild-URLs
    const tokens = [];
    nftCards.forEach((card) => {
      const imgEl = card.querySelector("img");
      if (imgEl && imgEl.src) {
        tokens.push({
          name: imgEl.alt || "NFT",
          image: imgEl.src,
        });
      }
    });

    if (tokens.length === 0)
      return res.status(404).json({
        error: "Keine NFT-Bilder gefunden. Eventuell reiner Collector oder Collab.",
      });

    // Optional: Limit auf z.B. 40 Bilder, um Ladezeit zu begrenzen
    res.status(200).json({ tokens: tokens.slice(0, 40) });
  } catch (e) {
    res.status(500).json({
      error: "Objkt konnte nicht analysiert werden: " + e.message,
    });
  }
}
