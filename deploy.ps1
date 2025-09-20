# Script de despliegue para Google Cloud Run
# Uso: .\deploy.ps1

Write-Host "🚀 Iniciando despliegue de Agrocostos API en Google Cloud Run..." -ForegroundColor Green

# Verificar que gcloud esté instalado
try {
    $gcloudVersion = gcloud --version 2>$null
    Write-Host "✅ Google Cloud CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud CLI no encontrado. Por favor instálalo primero." -ForegroundColor Red
    Write-Host "Descarga desde: https://cloud.google.com/sdk/docs/install-sdk#windows" -ForegroundColor Yellow
    exit 1
}

# Configurar proyecto
Write-Host "🔧 Configurando proyecto..." -ForegroundColor Yellow
gcloud config set project iconic-medium-386316

# Habilitar APIs necesarias
Write-Host "🔧 Habilitando APIs necesarias..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Construir y desplegar
Write-Host "🏗️ Construyendo y desplegando..." -ForegroundColor Yellow
gcloud run deploy agrocostos-api `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 2 `
  --timeout 900 `
  --max-instances 10 `
  --set-env-vars NODE_ENV=production

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ¡Despliegue exitoso!" -ForegroundColor Green
    Write-Host "🌐 Tu API está disponible en:" -ForegroundColor Cyan
    gcloud run services describe agrocostos-api --region=us-central1 --format="value(status.url)"
    Write-Host "📚 Documentación disponible en: [URL]/documentation" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error en el despliegue" -ForegroundColor Red
}
