// Archivo de prueba para obtener documentos PDF de las temporadas
const { obtenerTodosLosDocumentos, obtenerDocumentosTemporada, obtenerTemporadas } = require('./services/scraper');

async function probarDocumentos() {
  console.log('🚀 Iniciando prueba de obtención de documentos PDF...\n');
  
  try {
    // Probar con una temporada específica primero
    console.log('📋 Obteniendo temporadas...');
    const temporadas = await obtenerTemporadas();
    
    if (temporadas.length > 0) {
      console.log(`\n🔍 Probando con la primera temporada: ${temporadas[0].nombre}`);
      const documentos = await obtenerDocumentosTemporada(temporadas[0]);
      
      console.log(`\n📊 Resultados para "${temporadas[0].nombre}":`);
      console.log(`Total de documentos encontrados: ${documentos.length}`);
      
      documentos.forEach((doc, index) => {
        console.log(`\n${index + 1}. ${doc.nombre}`);
        console.log(`   - URL: ${doc.url}`);
        console.log(`   - Temporada: ${doc.temporada}`);
      });
      
      if (documentos.length > 0) {
        console.log('\n✅ ¡Funciona! Ahora probando con todas las temporadas...\n');
        
        // Probar con todas las temporadas
        const todosLosDocumentos = await obtenerTodosLosDocumentos();
        
        console.log('\n📊 Resumen final:');
        console.log(`Total de documentos encontrados: ${todosLosDocumentos.length}`);
        
        // Agrupar por temporada
        const porTemporada = {};
        todosLosDocumentos.forEach(doc => {
          if (!porTemporada[doc.temporada]) {
            porTemporada[doc.temporada] = [];
          }
          porTemporada[doc.temporada].push(doc);
        });
        
        Object.entries(porTemporada).forEach(([temporada, docs]) => {
          console.log(`\n📁 ${temporada}: ${docs.length} documentos`);
          docs.forEach((doc, index) => {
            console.log(`  ${index + 1}. ${doc.nombre}`);
          });
        });
      }
    } else {
      console.log('❌ No se encontraron temporadas');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
probarDocumentos().catch(console.error);
