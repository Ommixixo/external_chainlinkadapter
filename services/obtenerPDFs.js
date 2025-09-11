
const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');

// === Obtener PDFs de una temporada ===
async function obtenerPDFs(temporada) {
  const data = {
    NumPag: temporada.numPag || '1',
    getIdCarpDoc: temporada.idCarpDoc,
    getNombre_Arc_Doc: temporada.nombreArcDoc,
    Aplicacion: temporada.idAplicacion || '46',
    IdPadre: temporada.idSeguimientoPadre,
    key: '38988CC6D42723FBF48C19352FB8F66A6B3437EED9B1C102F6DF420A68932C39'
  };

  const response = await axios.post(
    'https://www.fira.gob.mx/InfEspDtoXML/TemasUsuario.jsp',
    qs.stringify(data),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.fira.gob.mx/Nd/Agrocostos.jsp',
        'Origin': 'https://www.fira.gob.mx',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
    }
  );

  const html = response.data;
  const $ = cheerio.load(html);
  const pdfs = [];

  console.log(`Buscando PDFs para temporada: ${temporada.nombre}`);
  console.log(`HTML recibido: ${html.substring(0, 500)}...`);

  // Buscar PDFs de diferentes maneras
  const selectores = [
    'a[href*=".pdf"]',
    'a[href*=".PDF"]',
    'a[href*="pdf"]',
    'a[href*="PDF"]',
    'a[onclick*="pdf"]',
    'a[onclick*="PDF"]'
  ];

  selectores.forEach(selector => {
    $(selector).each((i, el) => {
      const texto = $(el).text().trim();
      let url = $(el).attr('href') || $(el).attr('onclick');
      
      // Extraer URL del onclick si es necesario
      if (url && url.includes('pdf') && !url.startsWith('http')) {
        const urlMatch = url.match(/['"]([^'"]*\.pdf[^'"]*)['"]/i);
        if (urlMatch) {
          url = urlMatch[1];
        }
      }

      if (url && texto && url.toLowerCase().includes('pdf')) {
        if (!url.startsWith('http')) {
          url = url.startsWith('/') 
            ? `https://www.fira.gob.mx${url}`
            : `https://www.fira.gob.mx/${url}`;
        }

        // Evitar duplicados
        const existe = pdfs.some(pdf => pdf.url === url);
        if (!existe) {
          pdfs.push({ 
            nombre: texto, 
            url,
            temporada: temporada.nombre,
            selector: selector
          });
        }
      }
    });
  });

  // También buscar en tablas o divs que puedan contener PDFs
  $('tr, .pdf-link, .documento, .archivo').each((i, el) => {
    const $el = $(el);
    const texto = $el.text().trim();
    const link = $el.find('a[href*="pdf"], a[href*="PDF"]').first();
    
    if (link.length > 0 && texto && texto.length > 3) {
      let url = link.attr('href');
      
      if (url && !url.startsWith('http')) {
        url = url.startsWith('/') 
          ? `https://www.fira.gob.mx${url}`
          : `https://www.fira.gob.mx/${url}`;
      }

      const existe = pdfs.some(pdf => pdf.url === url);
      if (!existe) {
        pdfs.push({ 
          nombre: texto, 
          url,
          temporada: temporada.nombre,
          fuente: 'tabla'
        });
      }
    }
  });

  console.log(`Encontrados ${pdfs.length} PDFs para ${temporada.nombre}`);
  return pdfs;
}

async function getPdfs(buttons) {
  const pdfs = [];
  for (const button of buttons) {
    const formData = new URLSearchParams();
    formData.append('Aplicacion', button.idAplicacion);
    formData.append('NumPag', button.numPag);
    formData.append('getIdSeguimientoPadre', button.idSeguimientoPadre);
    formData.append('getNombre_Arc_Doc', button.nombreArcDoc);
    formData.append('getIdCarpDoc', button.idCarpDoc);

    try {
      const response = await axios.post('https://www.fira.gob.mx/InfEspDtoXML/TemasUsuario.jsp', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      $('a').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.endsWith('.pdf')) {
          pdfs.push({
            nombre: button.nombre,
            pdfUrl: href
          });
        }
      });
    } catch (error) {
      console.error(`Error al obtener PDFs para ${button.nombre}:`, error.message);
    }
  }
  return pdfs;
}


module.exports = { obtenerPDFs, getPdfs };
