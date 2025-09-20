# 🌾 Agrocostos Oráculo

API REST para obtener información de costos agrícolas desde el sitio web de FIRA (Fideicomisos Instituidos en Relación con la Agricultura) del gobierno mexicano.

## 📋 Descripción

Este proyecto es un web scraper que extrae datos de costos agrícolas de la página oficial de FIRA, proporcionando una API REST para acceder a información de temporadas, documentos PDF y filtros avanzados por tipo de cultivo y estado.

## 🚀 Características

- **Web Scraping Inteligente**: Utiliza Puppeteer para extraer datos dinámicos de la página de FIRA
- **API REST Completa**: Endpoints para obtener temporadas, documentos y filtros
- **Filtros Avanzados**: Búsqueda por tipo de cultivo y estado usando expresiones regulares
- **Manejo de Timeouts**: Configurado para manejar operaciones de larga duración
- **Respuestas Estructuradas**: JSON bien formateado con metadatos útiles

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **Puppeteer** - Web scraping y automatización
- **Cheerio** - Parsing de HTML
- **Axios** - Cliente HTTP

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/sergiosinecta/external_chainlinkadapter.git
   cd agrocostos-oraculo
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor**
   ```bash
   npm start
   ```

El servidor se ejecutará en `http://localhost:3000`

## 📚 API Endpoints

### 1. Obtener Temporadas
```http
GET /api/temporadas
```

**Respuesta:**
```json
[
  {
    "nombre": "Primavera - Verano 2025",
    "idAplicacion": "123",
    "idSeguimientoPadre": "456",
    "nombreArcDoc": "PV 2025",
    "idCarpDoc": "789",
    "numPag": "1"
  }
]
```

### 2. Obtener PDFs de una Temporada
```http
GET /api/pdfs/:idCarpDoc
```

### 3. Obtener PDFs Directos
```http
GET /api/pdfs-directos
```

### 4. Obtener Todos los PDFs
```http
GET /api/pdfs-todos
```

### 5. Obtener Documentos con Parámetros
```http
POST /api/documentos
Content-Type: application/json

{
  "idAplicacion": "123",
  "idSeguimientoPadre": "456",
  "nombreArcDoc": "PV 2025",
  "idCarpDoc": "789",
  "numPag": "1",
  "maxPaginas": 5
}
```

### 6. Obtener Documentos Completos
```http
POST /api/documentos-completos
Content-Type: application/json

{
  "idAplicacion": "123",
  "idSeguimientoPadre": "456",
  "nombreArcDoc": "PV 2025",
  "idCarpDoc": "789"
}
```

### 7. 🎯 Filtrar Documentos por Cultivo y Estado (NUEVO)
```http
POST /api/fira-documentos
Content-Type: application/json

{
  "temporada": "Primavera - Verano 2025",
  "crop_type": "Maíz",
  "state": "Sinaloa"
}
```

**Respuesta:**
```json
{
  "temporada": "PV 2025",
  "total": 150,
  "filtrados": 8,
  "filtros_aplicados": {
    "crop_type": "Maíz",
    "state": "Sinaloa",
    "regex_crop_type": "/Maíz/i",
    "regex_state": "/Sinaloa/i"
  },
  "documentos": [
    {
      "nombre": "Maíz_GMF_Sinaloa_PV_2025",
      "url": "https://www.fira.gob.mx/InfEspDtoXML/abrirArchivo.jsp?abreArc=131103",
      "abreArc": "131103",
      "temporada": "PV 2025"
    }
  ]
}
```

## 🔍 Filtros Avanzados

### Filtro por Tipo de Cultivo
El parámetro `crop_type` soporta expresiones regulares:

```json
// Búsqueda simple
{
  "crop_type": "Maíz"
}

// Múltiples cultivos
{
  "crop_type": "Maíz|Sorgo|Trigo"
}

// Cultivos que empiecen con "Ma"
{
  "crop_type": "^Ma"
}

// Cultivos con patrones específicos
{
  "crop_type": "(GMF|BMF|TMF)"
}
```

### Filtro por Estado
El parámetro `state` también soporta expresiones regulares:

```json
// Estado específico
{
  "state": "Sinaloa"
}

// Múltiples estados
{
  "state": "Sinaloa|Sonora|Nayarit"
}

// Estados que contengan "ina"
{
  "state": ".*ina.*"
}
```

### Combinación de Filtros
Puedes combinar ambos filtros para búsquedas precisas:

```json
{
  "temporada": "Primavera - Verano 2025",
  "crop_type": "Maíz|Sorgo",
  "state": "Sinaloa|Sonora"
}
```

## 📊 Estructura de Datos

### Documento
```json
{
  "nombre": "Maíz_GMF_Sinaloa_PV_2025",
  "url": "https://www.fira.gob.mx/InfEspDtoXML/abrirArchivo.jsp?abreArc=131103",
  "abreArc": "131103",
  "temporada": "PV 2025"
}
```

### Temporada
```json
{
  "nombre": "Primavera - Verano 2025",
  "idAplicacion": "123",
  "idSeguimientoPadre": "456",
  "nombreArcDoc": "PV 2025",
  "idCarpDoc": "789",
  "numPag": "1"
}
```

## 🧪 Ejemplos de Uso

### Obtener todos los documentos de Maíz en Sinaloa
```bash
curl -X POST http://localhost:3000/api/fira-documentos \
  -H "Content-Type: application/json" \
  -d '{
    "temporada": "Primavera - Verano 2025",
    "crop_type": "Maíz",
    "state": "Sinaloa"
  }'
```

### Buscar múltiples cultivos en varios estados
```bash
curl -X POST http://localhost:3000/api/fira-documentos \
  -H "Content-Type: application/json" \
  -d '{
    "temporada": "Primavera - Verano 2025",
    "crop_type": "Maíz|Sorgo|Trigo",
    "state": "Sinaloa|Sonora|Nayarit"
  }'
```

### Obtener solo el tipo de cultivo (sin filtro de estado)
```bash
curl -X POST http://localhost:3000/api/fira-documentos \
  -H "Content-Type: application/json" \
  -d '{
    "temporada": "Primavera - Verano 2025",
    "crop_type": "Trigo"
  }'
```

## ⚙️ Configuración

### Variables de Entorno
- `PORT`: Puerto del servidor (default: 3000)

### Timeouts
- **Servidor**: 10 minutos
- **Puppeteer**: 30 segundos para navegación
- **Paginación**: 5 páginas por defecto (configurable)

## 🐛 Solución de Problemas

### Puerto en Uso
```bash
# En Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# En Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Errores de Puppeteer
- Asegúrate de tener Chrome/Chromium instalado
- En servidores, instala las dependencias necesarias:
  ```bash
  sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
  ```

## 📝 Notas Importantes

- El scraping puede ser lento debido a la naturaleza de la página web
- Los timeouts están configurados para operaciones de larga duración
- Las expresiones regulares son case-insensitive por defecto
- El servidor maneja automáticamente caracteres especiales en las búsquedas

## 🤝 Contribuciones

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Sergio Del Castillo**
- GitHub: [@s/Ommixixo](https://github.com/Ommixixo)

## 📞 Soporte

Si tienes problemas o preguntas, por favor:
1. Revisa la sección de [Solución de Problemas](#-solución-de-problemas)
2. Abre un [Issue](https://github.com/Ommixixo/external_chainlinkadapter/issues)
3. Contacta al desarrollador

---

⭐ Si este proyecto te es útil, ¡dale una estrella!
