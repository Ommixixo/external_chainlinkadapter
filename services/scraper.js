// src/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const qs = require('qs');

const URL = 'https://www.fira.gob.mx/Nd/Agrocostos.jsp';

// === Obtener temporadas ===
async function obtenerTemporadas() {
  // Lanzar un navegador headless con Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new', // Modo headless moderno
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // Configurar User-Agent para evitar bloqueos
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navegar a la página
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Esperar a que los enlaces de períodos estén visibles (con selectores flexibles)
    try {
      await page.waitForSelector('ul li a[onclick*="IDgetIdSeguimientoPadre"]', { timeout: 5000 });
    } catch (error) {
      console.log('Selector específico no encontrado, esperando selectores más generales...');
      try {
        await page.waitForSelector('a[onclick*="IDgetIdSeguimientoPadre"]', { timeout: 5000 });
      } catch (error2) {
        console.log('Esperando cualquier enlace con onclick...');
        await page.waitForSelector('a[onclick]', { timeout: 5000 });
      }
    }

    // Extraer períodos
    const temporadas = await page.evaluate(() => {
      const resultados = [];
      const debugInfo = [];
      
      // Buscar enlaces que contengan onclick con los parámetros que necesitamos
      // Usar múltiples selectores para capturar todos los elementos posibles
      let elementos = [];
      
      // Selector 1: Enlaces dentro de ul li con onclick específico
      const elementos1 = document.querySelectorAll('ul li a[onclick*="IDgetIdSeguimientoPadre"]');
      debugInfo.push(`Selector ul li a[onclick*="IDgetIdSeguimientoPadre"]: ${elementos1.length} elementos`);
      
      // Selector 2: Cualquier enlace con onclick que contenga IDgetIdSeguimientoPadre
      const elementos2 = document.querySelectorAll('a[onclick*="IDgetIdSeguimientoPadre"]');
      debugInfo.push(`Selector a[onclick*="IDgetIdSeguimientoPadre"]: ${elementos2.length} elementos`);
      
      // Selector 3: Enlaces con onclick que contengan IDgetNombre_Arc_Doc
      const elementos3 = document.querySelectorAll('a[onclick*="IDgetNombre_Arc_Doc"]');
      debugInfo.push(`Selector a[onclick*="IDgetNombre_Arc_Doc"]: ${elementos3.length} elementos`);
      
      // Selector 4: Enlaces con onclick que contengan IDIdAplicacion con valor 46
      const elementos4 = document.querySelectorAll('a[onclick*="IDIdAplicacion"][onclick*="46"]');
      debugInfo.push(`Selector a[onclick*="IDIdAplicacion"][onclick*="46"]: ${elementos4.length} elementos`);
      
      // Combinar todos los elementos únicos
      const todosElementos = [...elementos1, ...elementos2, ...elementos3, ...elementos4];
      const elementosUnicos = [...new Set(todosElementos)];
      elementos = elementosUnicos;
      
      debugInfo.push(`Total de elementos únicos encontrados: ${elementos.length}`);

      debugInfo.push(`Encontrados ${elementos.length} elementos con onclick específico`);
      
      // Debug: mostrar todos los enlaces encontrados en la página
      const todosLosEnlaces = document.querySelectorAll('a');
      debugInfo.push(`Total de enlaces en la página: ${todosLosEnlaces.length}`);
      
      // Debug: mostrar enlaces con onclick
      const enlacesConOnclick = document.querySelectorAll('a[onclick]');
      debugInfo.push(`Enlaces con onclick: ${enlacesConOnclick.length}`);
      
      enlacesConOnclick.forEach((el, index) => {
        const texto = el.textContent.trim();
        const onclick = el.getAttribute('onclick');
        debugInfo.push(`Enlace ${index + 1}: "${texto}" - onclick: ${onclick ? onclick.substring(0, 50) + '...' : 'N/A'}`);
      });

      // Filtrar por nombres específicos que mencionaste
      const nombresDeseados = [
        'Primavera - Verano 2025',
        'O-I 2025/2026', 
        'OI 2025/2026',  // Agregar la variante con "OI"
        'Perennes 2025',
        'ACTUALIZACIÓN EN AGROCOSTOS PUBLICADOS',
        'PV 2025'
      ];

      elementos.forEach((el, index) => {
        const texto = el.textContent.trim();
        const onclick = el.getAttribute('onclick') || '';
        
        // Verificar si es un nombre deseado
        const esNombreDeseado = nombresDeseados.some(nombre => 
          texto.toLowerCase().includes(nombre.toLowerCase()) || 
          nombre.toLowerCase().includes(texto.toLowerCase())
        );
        
        // Solo mostrar debug para elementos deseados
        if (esNombreDeseado) {
          debugInfo.push(`Elemento deseado: "${texto}"`);
        }

        // Limpiar el onclick de caracteres de escape y saltos de línea para mejor parsing
        const onclickLimpio = onclick.replace(/[\r\n\s]+/g, ' ').trim();

        // Extraer parámetros usando el onclick limpio
        const extraerParametroLimpio = (regex) => {
          const match = onclickLimpio.match(regex);
          return match ? match[1] : null;
        };

        // Extraer parámetros usando patrones más específicos
        const idSeguimientoPadre = extraerParametroLimpio(/IDgetIdSeguimientoPadre.*?value='(\d+)'/) || 
                                  extraerParametroLimpio(/IDgetIdSeguimientoPadre.*?value="(\d+)"/);
                                  
        const nombreArcDoc = extraerParametroLimpio(/IDgetNombre_Arc_Doc.*?value='([^']+)'/) || 
                            extraerParametroLimpio(/IDgetNombre_Arc_Doc.*?value="([^"]+)"/);
                            
        const idCarpDoc = extraerParametroLimpio(/IDgetIdCarpDoc.*?value='(\d+)'/) || 
                         extraerParametroLimpio(/IDgetIdCarpDoc.*?value="(\d+)"/);
                         
        const idAplicacion = extraerParametroLimpio(/IDIdAplicacion.*?value='(\d+)'/) || 
                            extraerParametroLimpio(/IDIdAplicacion.*?value="(\d+)"/);
                            
        const numPag = extraerParametroLimpio(/IDNumPag.*?value='(\d+)'/) || 
                      extraerParametroLimpio(/IDNumPag.*?value="(\d+)"/);
        
        // Detectar si tiene charset (algunos elementos lo tienen)
        const tieneCharset = onclickLimpio.includes('document.charset');
        
        // Solo procesar elementos que sean nombres deseados (filtro más estricto)
        if (esNombreDeseado) {
          const params = {
            nombre: texto,
            idAplicacion: idAplicacion || '46',
            numPag: numPag || '1',
            idSeguimientoPadre: idSeguimientoPadre,
            nombreArcDoc: nombreArcDoc,
            idCarpDoc: idCarpDoc,
            action: '/InfEspDtoXML/TemasUsuario.jsp',
            tieneCharset: tieneCharset,
            esNombreDeseado: esNombreDeseado,
            onclick: onclick // Guardar el onclick completo para debugging
          };

          debugInfo.push(`Procesando: "${texto}" - Parámetros: ${idSeguimientoPadre ? 'OK' : 'FALTAN'}, Nombre deseado: ${esNombreDeseado ? 'SÍ' : 'NO'}`);
          resultados.push(params);
        } else {
          debugInfo.push(`Saltando elemento "${texto}" - faltan parámetros esenciales y no es nombre deseado`);
          debugInfo.push(`  - idSeguimientoPadre: ${idSeguimientoPadre}`);
          debugInfo.push(`  - nombreArcDoc: ${nombreArcDoc}`);
          debugInfo.push(`  - idCarpDoc: ${idCarpDoc}`);
        }
      });

      debugInfo.push(`Total de temporadas encontradas: ${resultados.length}`);
      
      return {
        temporadas: resultados,
        debugInfo: debugInfo
      };
    });

    // Mostrar información de debug
    if (temporadas.debugInfo) {
      console.log('\n🔍 Información de Debug:');
      temporadas.debugInfo.forEach(info => console.log(`  ${info}`));
    }

    return temporadas.temporadas && temporadas.temporadas.length > 0 ? temporadas.temporadas : [
      // Datos hardcodeados como respaldo (mantenidos por compatibilidad)
      {
        nombre: "Primavera - Verano 2025",
        idAplicacion: "46",
        numPag: "1",
        idSeguimientoPadre: "124963",
        nombreArcDoc: "PV 2025",
        idCarpDoc: "124963",
        action: "/InfEspDtoXML/TemasUsuario.jsp"
      },
      // ... otros períodos hardcodeadoss
    ];

  } catch (error) {
    console.error(`Error al obtener temporadas: ${error.message}`);
    return []; // O mantener los datos hardcodeados como respaldo
  } finally {
    await browser.close();
  }
}

// === Obtener PDFs directamente de la página principal ===
async function obtenerPDFsDirectos() {
  const { data } = await axios.get(URL);
  const $ = cheerio.load(data);
  const pdfs = [];

  $('a[href*=".pdf"]').each((i, el) => {
    const texto = $(el).text().trim();
    let url = $(el).attr('href');

    if (url && texto) {
      if (!url.startsWith('http')) {
        url = url.startsWith('/')
          ? `https://www.fira.gob.mx${url}`
          : `https://www.fira.gob.mx/${url}`;
      }

      pdfs.push({
        nombre: texto,
        url,
        fuente: 'página_principal'
      });
    }
  });

  return pdfs;
}

// === Función de prueba para debugging ===
async function probarScrapingTemporadas() {
  console.log('🔍 Iniciando prueba de scraping de temporadas...');
  
  try {
    const temporadas = await obtenerTemporadas();
    
    console.log('\n📊 Resultados del scraping:');
    console.log(`Total de temporadas encontradas: ${temporadas.length}`);
    
    temporadas.forEach((temporada, index) => {
      console.log(`\n${index + 1}. ${temporada.nombre}`);
      console.log(`   - ID Aplicación: ${temporada.idAplicacion}`);
      console.log(`   - ID Seguimiento Padre: ${temporada.idSeguimientoPadre}`);
      console.log(`   - Nombre Archivo Doc: ${temporada.nombreArcDoc}`);
      console.log(`   - ID Carpeta Doc: ${temporada.idCarpDoc}`);
      console.log(`   - Tiene Charset: ${temporada.tieneCharset ? 'Sí' : 'No'}`);
    });
    
    return temporadas;
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    return [];
  }
}

// === Obtener documentos PDF de una temporada específica con paginación ===
async function obtenerDocumentosTemporada(temporada, mostrarDebug = false) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navegar a la página principal primero para obtener la sesión
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Esperar un poco para que se establezca la sesión
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const todosLosDocumentos = [];
    let paginaActual = 1;
    let hayMasPaginas = true;
    
    while (hayMasPaginas) {
      if (mostrarDebug) {
        console.log(`\n📄 Procesando página ${paginaActual} de ${temporada.nombre}...`);
      }
      
      // Usar page.evaluate para simular el envío del formulario desde el navegador
      await page.evaluate((temp, pagina) => {
        // Crear y llenar el formulario como lo haría el navegador
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/InfEspDtoXML/TemasUsuario.jsp';
        form.style.display = 'none';
        
        // Agregar los campos del formulario
        const campos = {
          'NumPag': pagina.toString(),
          'getIdCarpDoc': temp.idCarpDoc,
          'getNombre_Arc_Doc': temp.nombreArcDoc,
          'Aplicacion': temp.idAplicacion,
          'IdPadre': temp.idSeguimientoPadre
        };
        
        Object.entries(campos).forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        
        // Enviar el formulario
        form.submit();
      }, temporada, paginaActual);
      
      // Esperar a que se cargue la nueva página
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      // Esperar un poco para que se cargue completamente
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Buscar enlaces específicos de agrocostos en la tabla
      const resultado = await page.evaluate((temp) => {
        const pdfs = [];
        const debugInfo = [];
        
        // Buscar enlaces con abrirArchivo.jsp en la tabla
        const enlaces = document.querySelectorAll('table.table-bordered a[href*="abrirArchivo.jsp"]');
        
        // Verificar si hay paginación
        const paginacion = document.querySelectorAll('table.table-bordered .pagination a');
        const totalPaginas = paginacion.length;
        
        enlaces.forEach((enlace) => {
          const texto = enlace.textContent.trim();
          let url = enlace.getAttribute('href');
          
          if (url && texto && !texto.match(/^[\d«»]+$/)) { // Excluir números de paginación
            // Asegurar que la URL sea completa
            if (!url.startsWith('http')) {
              url = url.startsWith('/') 
                ? `https://www.fira.gob.mx${url}`
                : `https://www.fira.gob.mx/${url}`;
            }
            
            // Extraer el ID del archivo del parámetro abreArc
            const abreArcMatch = url.match(/abreArc=(\d+)/);
            const abreArc = abreArcMatch ? abreArcMatch[1] : null;
            
            pdfs.push({
              nombre: texto,
              url: url,
              abreArc: abreArc,
              temporada: temp.nombre
            });
          }
        });
        
        return { pdfs, totalPaginas };
      }, temporada);
      
      // Agregar documentos de esta página
      todosLosDocumentos.push(...resultado.pdfs);
      
      if (mostrarDebug) {
        console.log(`  ✅ Encontrados ${resultado.pdfs.length} documentos en página ${paginaActual}`);
      }
      
      // Verificar si hay más páginas
      // Si encontramos menos de 15 documentos, probablemente es la última página
      // O si no hay enlaces de paginación activos
      // O si hemos alcanzado el límite de páginas especificado
      const limitePaginas = temporada.maxPaginas || 15;
      if (resultado.pdfs.length < 15 || paginaActual >= limitePaginas) {
        hayMasPaginas = false;
      } else {
        paginaActual++;
      }
    }
    
    if (mostrarDebug) {
      console.log(`📊 Total de documentos encontrados para ${temporada.nombre}: ${todosLosDocumentos.length}`);
    }
    
    return todosLosDocumentos;
    
  } catch (error) {
    console.error(`Error al obtener documentos para ${temporada.nombre}: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

// === Obtener documentos PDF de una temporada específica por parámetros ===
async function obtenerDocumentosPorParametros(parametros) {
  console.log('🔍 Obteniendo documentos PDF con parámetros específicos...');
  console.log('Parámetros:', parametros);
  try {
    // Validar que se proporcionen los parámetros necesarios
    const { idAplicacion, numPag, idSeguimientoPadre, nombreArcDoc, idCarpDoc, maxPaginas } = parametros;
    
    if (!idAplicacion || !idSeguimientoPadre || !nombreArcDoc || !idCarpDoc) {
      throw new Error('Faltan parámetros requeridos: idAplicacion, idSeguimientoPadre, nombreArcDoc, idCarpDoc');
    }
    
    const temporada = {
      nombre: nombreArcDoc,
      idAplicacion: idAplicacion,
      numPag: numPag || '1',
      idSeguimientoPadre: idSeguimientoPadre,
      nombreArcDoc: nombreArcDoc,
      idCarpDoc: idCarpDoc,
      maxPaginas: maxPaginas || 15 // Por defecto 15 páginas, pero se puede limitar
    };
    
    console.log(`📁 Procesando temporada: ${temporada.nombre}`);
    const documentos = await obtenerDocumentosTemporada(temporada, true);
    
    console.log(`\n🎉 Total de documentos encontrados: ${documentos.length}`);
    return documentos;
    
  } catch (error) {
    console.error('❌ Error al obtener documentos:', error.message);
    return [];
  }
}

// === Obtener todos los documentos PDF de todas las temporadas ===
async function obtenerTodosLosDocumentos() {
  console.log('🔍 Obteniendo documentos PDF de todas las temporadas...');
  
  try {
    // Primero obtener las temporadas
    const temporadas = await obtenerTemporadas();
    console.log(`📊 Encontradas ${temporadas.length} temporadas`);
    
    const todosLosDocumentos = [];
    
    for (const temporada of temporadas) {
      console.log(`\n📁 Procesando temporada: ${temporada.nombre}`);
      const documentos = await obtenerDocumentosTemporada(temporada);
      
      if (documentos.length > 0) {
        console.log(`  ✅ Encontrados ${documentos.length} documentos PDF`);
        todosLosDocumentos.push(...documentos);
      } else {
        console.log(`  ⚠️  No se encontraron documentos PDF`);
      }
    }
    
    console.log(`\n🎉 Total de documentos encontrados: ${todosLosDocumentos.length}`);
    return todosLosDocumentos;
    
  } catch (error) {
    console.error('❌ Error al obtener documentos:', error.message);
    return [];
  }
}

module.exports = { 
  obtenerTemporadas, 
  obtenerPDFsDirectos, 
  probarScrapingTemporadas,
  obtenerDocumentosTemporada,
  obtenerTodosLosDocumentos,
  obtenerDocumentosPorParametros
};