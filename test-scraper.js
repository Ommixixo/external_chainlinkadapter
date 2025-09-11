// Archivo de prueba para el scraper de temporadas
const { probarScrapingTemporadas } = require('./services/scraper');

async function main() {
  console.log('🚀 Iniciando prueba del scraper de temporadas...\n');
  
  try {
    const temporadas = await probarScrapingTemporadas();
    
    if (temporadas.length > 0) {
      console.log('\n✅ Prueba completada exitosamente');
      console.log(`Se encontraron ${temporadas.length} temporadas`);
    } else {
      console.log('\n⚠️  No se encontraron temporadas. Revisa la consola para más detalles.');
    }
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
main().catch(console.error);
