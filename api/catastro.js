export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Faltan coordenadas' });
  try {
    const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR?SRS=EPSG:4326&Coordenada_X=${lon}&Coordenada_Y=${lat}`;
    const response = await fetch(url);
    const xml = await response.text();
    const getVal = (tag) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
      return match ? match[1].trim() : null;
    };
    const pc1 = getVal('pc1');
    const pc2 = getVal('pc2');
    const rc = pc1 && pc2 ? pc1 + pc2 : null;
    res.json({
      referencia_catastral: rc,
      superficie_construida: null,
      anyo_construccion: null,
      uso: 'Residencial'
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
