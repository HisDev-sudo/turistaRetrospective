# 🚀 Deployment a Azure App Service

## Configuración para Azure

Este proyecto está configurado para desplegarse automáticamente en Azure App Service usando GitHub Actions.

### 📋 Archivos de configuración incluidos:

- `web.config` - Configuración IISNode para Azure
- `.deployment` - Configuración de deployment
- `deploy.cmd` - Script personalizado de deployment
- `.env.example` - Variables de entorno de ejemplo

### 🔧 Pasos para deployment:

1. **Crear App Service en Azure:**
   ```bash
   # Crear resource group
   az group create --name monopoly-rg --location "East US"
   
   # Crear App Service Plan
   az appservice plan create --name monopoly-plan --resource-group monopoly-rg --sku B1 --is-linux
   
   # Crear Web App
   az webapp create --resource-group monopoly-rg --plan monopoly-plan --name monopoly-corporativo --runtime "NODE|18-lts"
   ```

2. **Configurar GitHub Deployment:**
   - Ve a tu App Service en Azure Portal
   - Deployment Center → GitHub
   - Autoriza y selecciona el repositorio
   - Azure creará automáticamente el workflow

3. **Variables de entorno en Azure:**
   ```
   NODE_ENV=production
   WEBSITE_NODE_DEFAULT_VERSION=18.17.0
   SCM_DO_BUILD_DURING_DEPLOYMENT=true
   ```

### 🌐 Características optimizadas para Azure:

- ✅ **Auto-scaling** configurado
- ✅ **WebSockets** habilitados
- ✅ **HTTPS** forzado
- ✅ **Logs** de aplicación habilitados
- ✅ **Health checks** configurados

### 🔍 Troubleshooting:

Si hay problemas con WebSockets:
1. Habilitar WebSockets en Configuration → General Settings
2. Verificar que ARR Affinity esté habilitado
3. Configurar CORS si es necesario

### 📊 Monitoreo:

- Application Insights se configura automáticamente
- Logs disponibles en Log Stream
- Métricas en tiempo real en el dashboard

¡Tu juego estará disponible en: `https://monopoly-corporativo.azurewebsites.net`! 🎮