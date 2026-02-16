export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST erlaubt" });

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Keine Adresse übermittelt" });

  const query = address.startsWith("KT") 
    ? `query { token(where:{fa_contract:{_eq:"${address}"}}, limit:50){ name description metadata tags } }`
    : `query { token(where:{_or:[{creator_id:{_eq:"${address}"}},{issuer:{_eq:"${address}"}},{minter:{_eq:"${address}"}}]}, limit:50){ name description metadata tags } }`;

  try {
    const response = await fetch("https://data.objkt.com/v3/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    if (!response.ok) return res.status(502).json({ error: "Objkt API nicht erreichbar. Bitte später erneut versuchen." });

    const data = await response.json();
    if (!data || !data.data) return res.status(404).json({ error: "Keine Daten von Objkt erhalten. Eventuell falsche Adresse." });

    const tokens = Object.values(data.data)[0];
    if (!tokens || tokens.length === 0) return res.status(404).json({ error: "Keine Werke gefunden. Eventuell reiner Collector oder Collab." });

    res.status(200).json({ tokens });
  } catch (e) {
    res.status(500).json({ error: "Objkt API konnte nicht erreicht werden: " + e.message });
  }
}
