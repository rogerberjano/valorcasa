export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { via, numero, municipio, provincia } = req.query;

  if (!via || !municipio) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=${encodeURIComponent(provincia || '')}&Municipio=${encodeURIComponent(municipio)}&Sigla=CL&Calle=${encodeURIComponent(via)}&Numero=${encodeURIComponent(numero || '')}&Bloque=&Escalera=&Planta=&Puerta=&Celda=`;

    const response = await fetch(url);
    const xml = await response.text();

    // Extraer datos del XML
    const getVal = (tag) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
      return match ? match[1].trim() : null;
    };

    const rc = getVal('pc1') && getVal('pc2') ? getVal('pc1') + getVal('pc2') : null;
    const sup = getVal('sfc');
    const anyo = getVal('ant');
    const uso = getVal('luso');

    if (!rc) {
      return res.status(404).json({ error: 'No se encontró la finca en el Catastro' });
    }

    res.json({
      referencia_catastral: rc,
      superficie_construida: sup ? parseFloat(sup) : null,
      anyo_construccion: anyo ? parseInt(anyo) : null,
      uso: uso || 'Residencial'
    });

  } catch (e) {
    res.status(500).json({ error: 'Error consultando el Catastro', detalle: e.message });
  }
}
