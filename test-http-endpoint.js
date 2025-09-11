// Archivo de prueba para hacer requests HTTP al endpoint
const http = require('http');

async function probarEndpointHTTP() {
  console.log('🚀 Probando endpoint HTTP /api/documentos...\n');
  
  const postData = JSON.stringify({
    idAplicacion: '46',
    numPag: '1',
    idSeguimientoPadre: '124963',
    nombreArcDoc: 'PV 2025',
    idCarpDoc: '124963',
    maxPaginas: 2 // Limitar a solo 2 páginas para prueba rápida
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/documentos',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`📡 Headers:`, res.headers);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n📊 Respuesta del endpoint:');
          console.log(`Temporada: ${response.temporada}`);
          console.log(`Total de documentos: ${response.total}`);
          console.log(`Parámetros usados:`, response.parametros);
          
          if (response.documentos && response.documentos.length > 0) {
            console.log('\n📄 Primeros 3 documentos:');
            response.documentos.slice(0, 3).forEach((doc, index) => {
              console.log(`\n${index + 1}. ${doc.nombre}`);
              console.log(`   - URL: ${doc.url}`);
              console.log(`   - abreArc: ${doc.abreArc}`);
            });
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Error parseando respuesta:', error.message);
          console.log('📄 Respuesta raw:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error en request:', error.message);
      reject(error);
    });
    
    req.setTimeout(10 * 60 * 1000); // 10 minutos timeout
    
    req.write(postData);
    req.end();
  });
}

// Ejecutar la prueba
probarEndpointHTTP()
  .then(() => {
    console.log('\n✅ Prueba completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la prueba:', error.message);
    process.exit(1);
  });
