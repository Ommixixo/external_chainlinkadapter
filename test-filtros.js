// Script de prueba para el endpoint /fira-documentos con filtros
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function probarFiltros() {
  console.log('🧪 Probando filtros de documentos FIRA...\n');
  
  try {
    // Caso 1: Buscar documentos de maíz (case-insensitive)
    console.log('1️⃣ Probando filtro por "maiz" (case-insensitive)...');
    const response1 = await axios.post(`${BASE_URL}/fira-documentos`, {
      temporada: "O-I 2025/2026",
      crop_type: "maiz"
    });
    
    console.log(`✅ Encontrados ${response1.data.total_filtrados} documentos de maíz:`);
    response1.data.documentos.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.nombre}`);
    });
    console.log('');
    
    // Caso 2: Buscar documentos de MAIZ (mayúsculas)
    console.log('2️⃣ Probando filtro por "MAIZ" (mayúsculas)...');
    const response2 = await axios.post(`${BASE_URL}/fira-documentos`, {
      temporada: "O-I 2025/2026",
      crop_type: "MAIZ"
    });
    
    console.log(`✅ Encontrados ${response2.data.total_filtrados} documentos de MAIZ:`);
    response2.data.documentos.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.nombre}`);
    });
    console.log('');
    
    // Caso 3: Buscar documentos de Sinaloa
    console.log('3️⃣ Probando filtro por estado "sinaloa"...');
    const response3 = await axios.post(`${BASE_URL}/fira-documentos`, {
      temporada: "O-I 2025/2026",
      state: "sinaloa"
    });
    
    console.log(`✅ Encontrados ${response3.data.total_filtrados} documentos de Sinaloa:`);
    response3.data.documentos.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.nombre}`);
    });
    console.log('');
    
    // Caso 4: Buscar documentos de maíz en Sinaloa (combinado)
    console.log('4️⃣ Probando filtro combinado "maiz" + "sinaloa"...');
    const response4 = await axios.post(`${BASE_URL}/fira-documentos`, {
      temporada: "O-I 2025/2026",
      crop_type: "maiz",
      state: "sinaloa"
    });
    
    console.log(`✅ Encontrados ${response4.data.total_filtrados} documentos de maíz en Sinaloa:`);
    response4.data.documentos.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.nombre}`);
    });
    console.log('');
    
    // Caso 5: Buscar documentos de trigo
    console.log('5️⃣ Probando filtro por "trigo"...');
    const response5 = await axios.post(`${BASE_URL}/fira-documentos`, {
      temporada: "O-I 2025/2026",
      crop_type: "trigo"
    });
    
    console.log(`✅ Encontrados ${response5.data.total_filtrados} documentos de trigo:`);
    response5.data.documentos.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.nombre}`);
    });
    console.log('');
    
    // Caso 6: Sin filtros (todos los documentos)
    console.log('6️⃣ Probando sin filtros (todos los documentos)...');
    const response6 = await axios.post(`${BASE_URL}/fira-documentos`, {
      temporada: "O-I 2025/2026"
    });
    
    console.log(`✅ Total de documentos en la temporada: ${response6.data.total_documentos}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar las pruebas
probarFiltros();
