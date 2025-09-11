// Archivo de prueba para el endpoint de documentos
const { obtenerDocumentosPorParametros } = require('./services/scraper');

async function probarEndpoint() {
  console.log('🚀 Probando endpoint de documentos con paginación...\n');
  
  try {
    // Ejemplo con los parámetros de "Primavera - Verano 2025"
    const parametros = {
      idAplicacion: '46',
      numPag: '1',
      idSeguimientoPadre: '124963',
      nombreArcDoc: 'PV 2025',
      idCarpDoc: '124963'
    };
    
    console.log('📋 Parámetros de prueba:');
    console.log(JSON.stringify(parametros, null, 2));
    
    const documentos = await obtenerDocumentosPorParametros(parametros);
    
    console.log(`\n📊 Resultados:`);
    console.log(`Total de documentos encontrados: ${documentos.length}`);
    
    if (documentos.length > 0) {
      console.log('\n📄 Primeros 5 documentos:');
      documentos.slice(0, 5).forEach((doc, index) => {
        console.log(`\n${index + 1}. ${doc.nombre}`);
        console.log(`   - URL: ${doc.url}`);
        console.log(`   - abreArc: ${doc.abreArc}`);
        console.log(`   - Temporada: ${doc.temporada}`);
      });
      
      if (documentos.length > 5) {
        console.log(`\n... y ${documentos.length - 5} documentos más`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
probarEndpoint().catch(console.error);
