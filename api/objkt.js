export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: "Keine Adresse übermittelt" });
  }

  try {
    // REST-API von Objkt: alle Tokens eines Künstlers
    const url = `https://api.objkt.com/v2/tokens?creator=${encodeURIComponent(address)}&limit=20`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Objkt API nicht erreichbar. Bitte später erneut versuchen.");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Keine Werke gefunden. Eventuell falscher Künstler oder keine NFTs verfügbar.");
    }

    // Rückgabe der wichtigsten Daten für die Prompt-Generierung
    const tokens = data.map(t => ({
      name: t.name,
      description: t.metadata?.description || "",
      tags: t.metadata?.tags || [],
      metadata: t.metadata || {}
    }));

    res.status(200).json({ tokens });

  } catch (e) {
    console.error("Objkt API Fehler:", e.message);
    res.status(500).json({ error: e.message || "Objkt API konnte nicht erreicht werden." });
  }
}
