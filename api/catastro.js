export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { via, numero, municipio, provincia } = req.query;

  if (!via || !municipio) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    // Intentar primero con el municipio tal cual, luego sin acentos
    const limpiar = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    
    const viaLimpia = limpiar(via);
    const munLimpio = limpiar(municipio);
    const provLimpia = limpiar(provincia || municipio);

    const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=${encodeURIComponent(provLimpia)}&Municipio=${encodeURIComponent(munLimpio)}&Sigla=CL&Calle=${encodeURIComponent(viaLimpia)}&Numero=${encodeURIComponent(numero || '')}&Bloque=&Escalera=&Planta=&Puerta=&Celda=`;

    console.log('Llamando Catastro:', url);

    const response = await fetch(url);
    const xml = await response.text();

    console.log('Respuesta XML:', xml.substring(0, 500));

    const getVal = (tag) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
      return match ? match[1].trim() : null;
    };

    const pc1 = getVal('pc1');
    const pc2 = getVal('pc2');
    const rc = pc1 && pc2 ? pc1 + pc2 : null;
    const sup = getVal('sfc') || getVal('stl');
    const anyo = getVal('ant');
    const uso = getVal('luso');

    if (!rc) {
      // Devolver datos estimados en vez de error
      return res.json({
        referencia_catastral: null,
        superficie_construida: null,
        anyo_construccion: null,
        uso: null,
        xml_preview: xml.substring(0, 300)
      });
    }

    res.json({
      referencia_catastral: rc,
      superficie_construida: sup ? parseFloat(sup) : null,
      anyo_construccion: anyo ? parseInt(anyo) : null,
      uso: uso || 'Residencial'
    });

  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
