const axios = require('axios');

// Función para probar el endpoint /fira-documentos/pdfinfo2json
async function testPdfInfo2Json() {
  try {
    console.log('🧪 Probando endpoint /fira-documentos/pdfinfo2json...\n');
    
    // Datos de prueba
    const testData = {
      temporada: "Primavera-Verano 2024", // Ajusta según las temporadas disponibles
      crop_type: "maíz", // o "Maíz", "trigo", etc.
      state: "Jalisco" // opcional
    };
    
    console.log('📤 Enviando datos:', JSON.stringify(testData, null, 2));
    console.log('\n⏳ Procesando PDF... (esto puede tomar unos segundos)\n');
    
    // Hacer la petición POST al endpoint
    const response = await axios.post('http://localhost:3000/api/fira-documentos/pdfinfo2json', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 segundos de timeout para procesar PDF
    });
    
    console.log('✅ Respuesta exitosa!');
    console.log('📊 Datos estructurados extraídos:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Función para probar con diferentes cultivos
async function testMultipleCrops() {
  const cultivos = ['maíz', 'trigo', 'sorgo'];
  
  for (const cultivo of cultivos) {
    console.log(`\n🌾 Probando con cultivo: ${cultivo}`);
    console.log('='.repeat(50));
    
    try {
      const testData = {
        temporada: "Primavera-Verano 2024",
        crop_type: cultivo
      };
      
      const response = await axios.post('http://localhost:3000/api/fira-documentos/pdfinfo2json', testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      });
      
      console.log(`✅ ${cultivo}: Documento encontrado`);
      console.log(`📄 Archivo: ${response.data.documento_seleccionado}`);
      console.log(`🔗 URL: ${response.data.url_original}`);
      console.log(`📊 Páginas: ${response.data.datos_estructurados.metadata.numPages}`);
      
      // Mostrar metadatos extraídos
      const metadata = response.data.datos_estructurados.metadata;
      if (metadata.cultivo) console.log(`🌱 Cultivo: ${metadata.cultivo}`);
      if (metadata.zona) console.log(`📍 Zona: ${metadata.zona}`);
      if (metadata.ciclo) console.log(`🔄 Ciclo: ${metadata.ciclo}`);
      if (metadata.estado) console.log(`🗺️ Estado: ${metadata.estado}`);
      
    } catch (error) {
      console.log(`❌ ${cultivo}: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  console.log('🚀 Iniciando pruebas del endpoint /fira-documentos/pdfinfo2json\n');
  
  // Primera prueba con un cultivo específico
  testPdfInfo2Json()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 Iniciando pruebas con múltiples cultivos...\n');
      return testMultipleCrops();
    })
    .then(() => {
      console.log('\n✅ Todas las pruebas completadas');
    })
    .catch(error => {
      console.error('\n❌ Error en las pruebas:', error.message);
    });
}

module.exports = { testPdfInfo2Json, testMultipleCrops };
