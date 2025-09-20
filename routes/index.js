
const express = require('express');
const router = express.Router();
const { obtenerTemporadas, obtenerPDFsDirectos, obtenerDocumentosPorParametros } = require('../services/scraper');
const { obtenerPDFs } = require('../services/obtenerPDFs');
const axios = require('axios');
const pdfParse = require('pdf-parse');

/**
 * @swagger
 * components:
 *   schemas:
 *     Temporada:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Primavera - Verano 2025"
 *         idAplicacion:
 *           type: string
 *           example: "46"
 *         numPag:
 *           type: string
 *           example: "1"
 *         idSeguimientoPadre:
 *           type: string
 *           example: "124963"
 *         nombreArcDoc:
 *           type: string
 *           example: "PV 2025"
 *         idCarpDoc:
 *           type: string
 *           example: "124963"
 *         action:
 *           type: string
 *           example: "/InfEspDtoXML/TemasUsuario.jsp"
 *     PDF:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Costos de Producción - Maíz"
 *         url:
 *           type: string
 *           example: "https://www.fira.gob.mx/archivo.pdf"
 *         temporada:
 *           type: string
 *           example: "PV 2025"
 *     Documento:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Costos de Producción - Maíz - Sinaloa"
 *         url:
 *           type: string
 *           example: "https://www.fira.gob.mx/abrirArchivo.jsp?abreArc=12345"
 *         abreArc:
 *           type: string
 *           example: "12345"
 *         temporada:
 *           type: string
 *           example: "PV 2025"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "No se pudieron obtener las temporadas"
 * tags:
 *   - name: Temporadas
 *     description: Endpoints para obtener información de temporadas agrícolas
 *   - name: PDFs
 *     description: Endpoints para obtener documentos PDF
 *   - name: Documentos
 *     description: Endpoints para obtener documentos específicos
 */


/**
 * @swagger
 * /api/temporadas:
 *   get:
 *     summary: Obtener lista de temporadas disponibles
 *     description: Retorna todas las temporadas agrícolas disponibles en FIRA con sus parámetros de configuración
 *     tags: [Temporadas]
 *     responses:
 *       200:
 *         description: Lista de temporadas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Temporada'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Endpoint 1: Listar temporadas
router.get('/temporadas', async (req, res) => {
  try {
    const temporadas = await obtenerTemporadas();
    res.json(temporadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron obtener las temporadas' });
  }
});

/**
 * @swagger
 * /api/pdfs/{idCarpDoc}:
 *   get:
 *     summary: Obtener PDFs de una temporada específica
 *     description: Retorna todos los documentos PDF disponibles para una temporada específica
 *     tags: [PDFs]
 *     parameters:
 *       - in: path
 *         name: idCarpDoc
 *         required: true
 *         description: ID de la carpeta de documentos de la temporada
 *         schema:
 *           type: string
 *           example: "124963"
 *     responses:
 *       200:
 *         description: Lista de PDFs obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PDF'
 *       404:
 *         description: Temporada no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Endpoint 2: Listar PDFs de una temporada
router.get('/pdfs/:idCarpDoc', async (req, res) => {
  try {
    const { idCarpDoc } = req.params;
    const temporadas = await obtenerTemporadas();
    const temporada = temporadas.find(t => t.idCarpDoc === idCarpDoc);

    if (!temporada) {
      return res.status(404).json({ error: 'Temporada no encontrada' });
    }

    const pdfs = await obtenerPDFs(temporada);
    res.json(pdfs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron obtener los PDFs' });
  }
});

// Endpoint 3: Obtener PDFs directamente de la página principal
router.get('/pdfs-directos', async (req, res) => {
  try {
    const pdfs = await obtenerPDFsDirectos();
    res.json(pdfs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron obtener los PDFs directos' });
  }
});

// Endpoint 4: Obtener todos los PDFs (temporadas + directos)
router.get('/pdfs-todos', async (req, res) => {
  try {
    const temporadas = await obtenerTemporadas();
    const pdfsDirectos = await obtenerPDFsDirectos();
    
    const todosLosPdfs = [...pdfsDirectos];
    
    // Intentar obtener PDFs de cada temporada
    for (const temporada of temporadas) {
      if (temporada.idSeguimientoPadre && temporada.idCarpDoc) {
        try {
          const pdfsTemporada = await obtenerPDFs(temporada);
          todosLosPdfs.push(...pdfsTemporada);
        } catch (error) {
          console.log(`Error obteniendo PDFs para ${temporada.nombre}:`, error.message);
        }
      }
    }
    
    res.json({
      total: todosLosPdfs.length,
      pdfs: todosLosPdfs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron obtener todos los PDFs' });
  }
});

// Endpoint 5: Obtener documentos PDF por parámetros específicos (con paginación)
router.post('/documentos', async (req, res) => {
  console.log('Documentos');
  try {
    const { idAplicacion, numPag, idSeguimientoPadre, nombreArcDoc, idCarpDoc, maxPaginas } = req.body;
    
    // Validar parámetros requeridos
    if (!idAplicacion || !idSeguimientoPadre || !nombreArcDoc || !idCarpDoc) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos',
        requeridos: ['idAplicacion', 'idSeguimientoPadre', 'nombreArcDoc', 'idCarpDoc'],
        opcionales: ['numPag', 'maxPaginas']
      });
    }
    
    const parametros = {
      idAplicacion,
      numPag: numPag || '1',
      idSeguimientoPadre,
      nombreArcDoc,
      idCarpDoc,
      maxPaginas: maxPaginas || 5 // Limitar a 5 páginas por defecto para evitar timeout
    };
    
    console.log('📥 Parámetros recibidos:', parametros);
    
    const documentos = await obtenerDocumentosPorParametros(parametros);
    console.log('Documents:', documentos);
    
    res.json({
      temporada: nombreArcDoc,
      total: documentos.length,
      documentos: documentos,
      parametros: parametros
    });
    
  } catch (error) {
    console.error('Error en endpoint /documentos:', error);
    res.status(500).json({ 
      error: 'No se pudieron obtener los documentos',
      mensaje: error.message 
    });
  }
});

// Endpoint 6: Obtener documentos PDF por parámetros específicos (SIN límite de páginas - para uso interno)
router.post('/documentos-completos', async (req, res) => {
  console.log('Documentos Completos');
  try {
    const { idAplicacion, numPag, idSeguimientoPadre, nombreArcDoc, idCarpDoc } = req.body;
    
    // Validar parámetros requeridos
    if (!idAplicacion || !idSeguimientoPadre || !nombreArcDoc || !idCarpDoc) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos',
        requeridos: ['idAplicacion', 'idSeguimientoPadre', 'nombreArcDoc', 'idCarpDoc'],
        opcionales: ['numPag']
      });
    }
    
    const parametros = {
      idAplicacion,
      numPag: numPag || '1',
      idSeguimientoPadre,
      nombreArcDoc,
      idCarpDoc
    };
    
    console.log('📥 Parámetros recibidos (completos):', parametros);
    
    const documentos = await obtenerDocumentosPorParametros(parametros);
    console.log('Documents (completos):', documentos);
    
    res.json({
      temporada: nombreArcDoc,
      total: documentos.length,
      documentos: documentos,
      parametros: parametros
    });
    
  } catch (error) {
    console.error('Error en endpoint /documentos-completos:', error);
    res.status(500).json({ 
      error: 'No se pudieron obtener los documentos completos',
      mensaje: error.message 
    });
  }
});


/**
 * @swagger
 * /api/fira-documentos:
 *   post:
 *     summary: Obtener documentos FIRA filtrados por cultivo y estado
 *     description: Retorna documentos PDF filtrados por tipo de cultivo y estado específico
 *     tags: [Documentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - temporada
 *               - crop_type
 *             properties:
 *               temporada:
 *                 type: string
 *                 description: Nombre de la temporada agrícola
 *                 example: "Primavera - Verano 2025"
 *               crop_type:
 *                 type: string
 *                 description: Tipo de cultivo a filtrar (puede ser expresión regular)
 *                 example: "maíz"
 *               state:
 *                 type: string
 *                 description: Estado a filtrar (opcional, puede ser expresión regular)
 *                 example: "Sinaloa"
 *     responses:
 *       200:
 *         description: Documentos filtrados obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 temporada:
 *                   type: string
 *                   example: "PV 2025"
 *                 total:
 *                   type: number
 *                   example: 25
 *                 filtrados:
 *                   type: number
 *                   example: 5
 *                 filtros_aplicados:
 *                   type: object
 *                   properties:
 *                     crop_type:
 *                       type: string
 *                       example: "maíz"
 *                     state:
 *                       type: string
 *                       example: "Sinaloa"
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *       400:
 *         description: Parámetros requeridos faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Temporada no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/fira-documentos', async (req, res) => {
  console.log('Fira Documentos');
  try {
    const { temporada, crop_type, state} = req.body;
    
    // Validar que crop_type esté presente
    if (!crop_type) {
      return res.status(400).json({ error: 'El parámetro crop_type es requerido' });
    }
    
    const temporadas = await obtenerTemporadas();
    const season = temporadas.find(t => t.nombre === temporada);
    if (!season) {
      return res.status(404).json({ error: 'Temporada no encontrada' });
    }
    const data = {};
    data.idAplicacion = season.idAplicacion;
    data.idSeguimientoPadre = season.idSeguimientoPadre;
	  data.nombreArcDoc = season.nombreArcDoc;
	  data.idCarpDoc = season.idCarpDoc;
    data.numPag = season.numPag;
    data.crop_type = crop_type;
    
    data.state = state;
    const documentos = await obtenerDocumentosPorParametros(data);
    console.log('Documents:', documentos);

    // Crear expresión regular para filtrar por crop_type
    let regex;
    try {
      // Si crop_type no contiene caracteres de regex, tratarlo como texto literal
      if (!/[.*+?^${}()|[\]\\]/.test(crop_type)) {
        // Escapar caracteres especiales y hacer búsqueda case-insensitive
        const escapedCropType = crop_type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedCropType, 'i');
      } else {
        // Si contiene caracteres de regex, usarlo directamente
        regex = new RegExp(crop_type, 'i');
      }
    } catch (regexError) {
      return res.status(400).json({ 
        error: 'Expresión regular inválida en crop_type', 
        mensaje: regexError.message,
        crop_type: crop_type
      });
    }

    // Crear expresión regular para filtrar por state (si se proporciona)
    let stateRegex = null;
    if (state) {
      try {
        // Si state no contiene caracteres de regex, tratarlo como texto literal
        if (!/[.*+?^${}()|[\]\\]/.test(state)) {
          // Escapar caracteres especiales y hacer búsqueda case-insensitive
          const escapedState = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          stateRegex = new RegExp(escapedState, 'i');
        } else {
          // Si contiene caracteres de regex, usarlo directamente
          stateRegex = new RegExp(state, 'i');
        }
      } catch (regexError) {
        return res.status(400).json({ 
          error: 'Expresión regular inválida en state', 
          mensaje: regexError.message,
          state: state
        });
      }
    }

    // Aplicar filtros combinados
    let documentosFiltrados = documentos;
    
    // Filtrar por crop_type
    documentosFiltrados = documentosFiltrados.filter(doc => regex.test(doc.nombre));
    
    // Filtrar por state si se proporciona
    if (stateRegex) {
      documentosFiltrados = documentosFiltrados.filter(doc => stateRegex.test(doc.nombre));
    }
    
    res.json({
      temporada: data.nombreArcDoc,
      total: documentos.length,
      filtrados: documentosFiltrados.length,
      filtros_aplicados: {
        crop_type: crop_type,
        state: state || null,
        regex_crop_type: regex.toString(),
        regex_state: stateRegex ? stateRegex.toString() : null
      },
      documentos: documentosFiltrados
    });
  } catch (error) {
    console.error('Error en endpoint /fira-documentos:', error);
    res.status(500).json({ error: 'No se pudieron obtener los documentos de FIRA' });
  }
});


router.post('/fira-documentos/pdfinfo', async (req, res) => {
  console.log('Fira Documentos');
  try {
    const { temporada, crop_type, state} = req.body;
    
    // Validar que crop_type esté presente
    if (!crop_type) {
      return res.status(400).json({ error: 'El parámetro crop_type es requerido' });
    }
    
    const temporadas = await obtenerTemporadas();
    const season = temporadas.find(t => t.nombre === temporada);
    if (!season) {
      return res.status(404).json({ error: 'Temporada no encontrada' });
    }
    const data = {};
    data.idAplicacion = season.idAplicacion;
    data.idSeguimientoPadre = season.idSeguimientoPadre;
	  data.nombreArcDoc = season.nombreArcDoc;
	  data.idCarpDoc = season.idCarpDoc;
    data.numPag = season.numPag;
    data.crop_type = crop_type;
    
    data.state = state;
    const documentos = await obtenerDocumentosPorParametros(data);
    console.log('Documents:', documentos);

    // Crear expresión regular para filtrar por crop_type
    let regex;
    try {
      // Si crop_type no contiene caracteres de regex, tratarlo como texto literal
      if (!/[.*+?^${}()|[\]\\]/.test(crop_type)) {
        // Escapar caracteres especiales y hacer búsqueda case-insensitive
        const escapedCropType = crop_type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedCropType, 'i');
      } else {
        // Si contiene caracteres de regex, usarlo directamente
        regex = new RegExp(crop_type, 'i');
      }
    } catch (regexError) {
      return res.status(400).json({ 
        error: 'Expresión regular inválida en crop_type', 
        mensaje: regexError.message,
        crop_type: crop_type
      });
    }

    // Crear expresión regular para filtrar por state (si se proporciona)
    let stateRegex = null;
    if (state) {
      try {
        // Si state no contiene caracteres de regex, tratarlo como texto literal
        if (!/[.*+?^${}()|[\]\\]/.test(state)) {
          // Escapar caracteres especiales y hacer búsqueda case-insensitive
          const escapedState = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          stateRegex = new RegExp(escapedState, 'i');
        } else {
          // Si contiene caracteres de regex, usarlo directamente
          stateRegex = new RegExp(state, 'i');
        }
      } catch (regexError) {
        return res.status(400).json({ 
          error: 'Expresión regular inválida en state', 
          mensaje: regexError.message,
          state: state
        });
      }
    }

    // Aplicar filtros combinados
    let documentosFiltrados = documentos;
    
    // Filtrar por crop_type
    documentosFiltrados = documentosFiltrados.filter(doc => regex.test(doc.nombre));
    
    // Filtrar por state si se proporciona
    if (stateRegex) {
      documentosFiltrados = documentosFiltrados.filter(doc => stateRegex.test(doc.nombre));
    }
    
    documentosFiltrados[0].url;
    res.json({
      documentos: documentosFiltrados[0].url
    });
  } catch (error) {
    console.error('Error en endpoint /fira-documentos:', error);
    res.status(500).json({ error: 'No se pudieron obtener los documentos de FIRA' });
  }
});

// Función para procesar PDF y extraer información estructurada
async function pdfToJson(urlPdf) {
  try {
    // Descargar el PDF desde la URL
    const response = await axios.get(urlPdf, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 segundos de timeout
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const dataBuffer = Buffer.from(response.data);
    const data = await pdfParse(dataBuffer);

    // Texto plano extraído
    const texto = data.text;

    // Estructura del JSON de respuesta
    const json = {
      metadata: {
        numPages: data.numpages,
        info: data.info || {},
        version: data.version || null
      },
      resumen_costos: [],
      memoria_tecnica: [],
      analisis_sensibilidad: [],
      texto_completo: texto
    };

    // Extraer información de metadatos del documento
    const cultivoMatch = texto.match(/Cultivo:\s*(.+)/i);
    const zonaMatch = texto.match(/Zona:\s*(.+)/i);
    const cicloMatch = texto.match(/Ciclo:\s*(.+)/i);
    const estadoMatch = texto.match(/Estado:\s*(.+)/i);
    const temporadaMatch = texto.match(/Temporada:\s*(.+)/i);
    
    if (cultivoMatch) json.metadata.cultivo = cultivoMatch[1].trim();
    if (zonaMatch) json.metadata.zona = zonaMatch[1].trim();
    if (cicloMatch) json.metadata.ciclo = cicloMatch[1].trim();
    if (estadoMatch) json.metadata.estado = estadoMatch[1].trim();
    if (temporadaMatch) json.metadata.temporada = temporadaMatch[1].trim();

    // Extraer tabla de costos
    const lineas = texto.split('\n');
    let enCostos = false;
    let enMemoriaTecnica = false;
    let enAnalisisSensibilidad = false;

    for (const linea of lineas) {
      const lineaTrim = linea.trim();
      
      // Detectar secciones
      if (lineaTrim.toLowerCase().includes('resumen de costos') || 
          lineaTrim.toLowerCase().includes('costos de producción')) {
        enCostos = true;
        enMemoriaTecnica = false;
        enAnalisisSensibilidad = false;
        continue;
      }
      
      if (lineaTrim.toLowerCase().includes('memoria técnica') || 
          lineaTrim.toLowerCase().includes('metodología')) {
        enMemoriaTecnica = true;
        enCostos = false;
        enAnalisisSensibilidad = false;
        continue;
      }
      
      if (lineaTrim.toLowerCase().includes('análisis de sensibilidad') || 
          lineaTrim.toLowerCase().includes('sensibilidad')) {
        enAnalisisSensibilidad = true;
        enCostos = false;
        enMemoriaTecnica = false;
        continue;
      }

      // Procesar líneas según la sección actual
      if (enCostos && lineaTrim && !lineaTrim.toLowerCase().includes('total:')) {
        // Buscar líneas que parecen costos (contienen números y conceptos)
        if (lineaTrim.match(/\d+/) && (lineaTrim.includes('$') || lineaTrim.includes('peso') || lineaTrim.includes('costo'))) {
          json.resumen_costos.push(lineaTrim);
        }
      }
      
      if (enMemoriaTecnica && lineaTrim) {
        json.memoria_tecnica.push(lineaTrim);
      }
      
      if (enAnalisisSensibilidad && lineaTrim) {
        json.analisis_sensibilidad.push(lineaTrim);
      }

      // Detectar fin de sección de costos
      if (enCostos && lineaTrim.toLowerCase().includes('total:')) {
        enCostos = false;
      }
    }

    return json;
  } catch (error) {
    throw new Error(`Error procesando PDF: ${error.message}`);
  }
}

// Endpoint 8: Obtener información estructurada de PDF desde URL
router.post('/fira-documentos/pdfinfo2json', async (req, res) => {
  console.log('Fira Documentos PDF Info to JSON');
  
  // Configurar timeout más largo para este endpoint
  req.setTimeout(5 * 60 * 1000); // 5 minutos
  res.setTimeout(5 * 60 * 1000); // 5 minutos
  
  try {
    const { temporada, crop_type, state } = req.body;
    
    // Validar que crop_type esté presente
    if (!crop_type) {
      return res.status(400).json({ error: 'El parámetro crop_type es requerido' });
    }
    
    // Obtener la URL del PDF usando el endpoint existente
    const temporadas = await obtenerTemporadas();
    const season = temporadas.find(t => t.nombre === temporada);
    if (!season) {
      return res.status(404).json({ error: 'Temporada no encontrada' });
    }
    
    const data = {};
    data.idAplicacion = season.idAplicacion;
    data.idSeguimientoPadre = season.idSeguimientoPadre;
    data.nombreArcDoc = season.nombreArcDoc;
    data.idCarpDoc = season.idCarpDoc;
    data.numPag = season.numPag;
    data.crop_type = crop_type;
    data.state = state;
    
    const documentos = await obtenerDocumentosPorParametros(data);
    console.log('Documents:', documentos);

    // Crear expresión regular para filtrar por crop_type
    let regex;
    try {
      if (!/[.*+?^${}()|[\]\\]/.test(crop_type)) {
        const escapedCropType = crop_type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedCropType, 'i');
      } else {
        regex = new RegExp(crop_type, 'i');
      }
    } catch (regexError) {
      return res.status(400).json({ 
        error: 'Expresión regular inválida en crop_type', 
        mensaje: regexError.message,
        crop_type: crop_type
      });
    }

    // Crear expresión regular para filtrar por state (si se proporciona)
    let stateRegex = null;
    if (state) {
      try {
        if (!/[.*+?^${}()|[\]\\]/.test(state)) {
          const escapedState = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          stateRegex = new RegExp(escapedState, 'i');
        } else {
          stateRegex = new RegExp(state, 'i');
        }
      } catch (regexError) {
        return res.status(400).json({ 
          error: 'Expresión regular inválida en state', 
          mensaje: regexError.message,
          state: state
        });
      }
    }

    // Aplicar filtros combinados
    let documentosFiltrados = documentos;
    
    // Filtrar por crop_type
    documentosFiltrados = documentosFiltrados.filter(doc => regex.test(doc.nombre));
    
    // Filtrar por state si se proporciona
    if (stateRegex) {
      documentosFiltrados = documentosFiltrados.filter(doc => stateRegex.test(doc.nombre));
    }
    
    if (documentosFiltrados.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontraron documentos que coincidan con los filtros aplicados' 
      });
    }

    // Obtener la URL del primer documento filtrado
    const urlPdf = documentosFiltrados[0].url;
    console.log('Procesando PDF desde URL:', urlPdf);
    console.log('Documento seleccionado:', documentosFiltrados[0].nombre);

    // Procesar el PDF y extraer información estructurada
    console.log('Iniciando descarga y procesamiento del PDF...');
    const pdfData = await pdfToJson(urlPdf);
    console.log('PDF procesado exitosamente');
    
    res.json({
      temporada: data.nombreArcDoc,
      url_original: urlPdf,
      documento_seleccionado: documentosFiltrados[0].nombre,
      total_documentos_encontrados: documentosFiltrados.length,
      filtros_aplicados: {
        crop_type: crop_type,
        state: state || null
      },
      datos_estructurados: pdfData
    });
    
  } catch (error) {
    console.error('Error en endpoint /fira-documentos/pdfinfo2json:', error);
    res.status(500).json({ 
      error: 'No se pudo procesar el documento PDF',
      mensaje: error.message 
    });
  }
});


module.exports = router;