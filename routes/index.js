
const express = require('express');
const router = express.Router();
const { obtenerTemporadas, obtenerPDFsDirectos, obtenerDocumentosPorParametros } = require('../services/scraper');
const { obtenerPDFs } = require('../services/obtenerPDFs');

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
module.exports = router;