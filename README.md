# Softtek Rimac API

Una API RESTful desarrollada con Node.js 20, TypeScript y Serverless Framework que integra la API de Star Wars (SWAPI) con una API meteorológica, fusionando datos y proporcionando funcionalidades de almacenamiento y consulta.

## 🚀 Características

- **Integración de APIs**: Combina datos de SWAPI y WeatherAPI
- **Fusión de datos**: Crea modelos unificados con información de personajes y clima
- **Sistema de caché**: Implementa caché de 30 minutos para optimizar rendimiento
- **Base de datos**: Almacenamiento en DynamoDB con TTL automático
- **Validación**: Validación robusta de entrada con Joi
- **Logging**: Sistema de logging estructurado con Winston
- **Trazabilidad**: Integración con AWS X-Ray para monitoreo
- **Testing**: Pruebas unitarias y de integración con Jest
- **TypeScript**: Tipado estático para mayor seguridad del código

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway  │───▶│   AWS Lambda    │───▶│   DynamoDB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Services      │
                       │  - Star Wars    │
                       │  - Weather      │
                       │  - Fusion       │
                       │  - Database     │
                       └─────────────────┘
```

## 📋 Endpoints

### 1. GET /fusionados
Obtiene datos fusionados de Star Wars y meteorológicos.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "character": {
      "name": "Luke Skywalker",
      "height": 172,
      "mass": 77,
      "homeworld": "https://swapi.dev/api/planets/1/"
    },
    "planet": {
      "name": "Tatooine",
      "climate": "arid",
      "terrain": "desert"
    },
    "weather": {
      "location": {
        "name": "Tunisia",
        "country": "Tunisia"
      },
      "current": {
        "temp_c": 25.5,
        "condition": {
          "text": "Sunny"
        }
      }
    },
    "fusion_timestamp": 1703123456789
  },
  "timestamp": 1703123456789
}
```

### 2. POST /almacenar
Almacena información personalizada en la base de datos.

**Body:**
```json
{
  "title": "Mi Nota",
  "description": "Descripción de la nota",
  "category": "personal",
  "tags": ["importante", "urgente"],
  "metadata": {
    "priority": "high"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-generado",
    "title": "Mi Nota",
    "description": "Descripción de la nota",
    "category": "personal",
    "tags": ["importante", "urgente"],
    "metadata": {
      "priority": "high"
    },
    "created_at": 1703123456789,
    "updated_at": 1703123456789
  },
  "message": "Data stored successfully",
  "timestamp": 1703123456789
}
```

### 3. GET /historial
Consulta el historial de datos almacenados con paginación.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)
- `type`: Tipo de datos (`fused` o `custom`)
- `category`: Categoría para filtrar

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": 1703123456789
}
```

## 🛠️ Tecnologías

- **Runtime**: Node.js 20
- **Framework**: Serverless Framework
- **Lenguaje**: TypeScript
- **Base de datos**: Amazon DynamoDB
- **Compute**: AWS Lambda
- **API Gateway**: Amazon API Gateway
- **Monitoreo**: AWS X-Ray, CloudWatch
- **Testing**: Jest
- **Validación**: Joi
- **Logging**: Winston
- **HTTP Client**: Axios

## 📦 Instalación

### Prerrequisitos
- Node.js 20 o superior
- AWS CLI configurado
- Serverless Framework instalado globalmente

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd softtek-rimac-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
AWS_REGION=us-east-1
WEATHER_API_KEY=tu_api_key_de_weatherapi
NODE_ENV=development
LOG_LEVEL=info
```

4. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

5. **Ejecutar pruebas**
```bash
npm test
npm run test:coverage
```

6. **Desplegar a AWS**
```bash
npm run deploy
```

## 🔧 Configuración

### Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `AWS_REGION` | Región de AWS | `us-east-1` |
| `WEATHER_API_KEY` | API Key de WeatherAPI | `demo-key` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `LOG_LEVEL` | Nivel de logging | `info` |
| `DYNAMODB_TABLE` | Nombre de la tabla DynamoDB | `softtek-rimac-api-{stage}` |

### Configuración de Serverless

El archivo `serverless.yml` incluye:
- Configuración de Lambda con timeout de 30s y 512MB de memoria
- Configuración de DynamoDB con índices globales
- Configuración de X-Ray para trazabilidad
- Configuración de CORS para API Gateway

## 🧪 Testing

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas en modo watch
```bash
npm run test:watch
```

### Generar reporte de cobertura
```bash
npm run test:coverage
```

### Estructura de pruebas
- **Unit Tests**: Pruebas individuales de servicios
- **Integration Tests**: Pruebas de integración entre servicios
- **BDD Approach**: Uso de Gherkin-style describe/it para claridad

## 📊 Monitoreo y Observabilidad

### AWS X-Ray
- Trazabilidad de requests
- Análisis de latencias
- Identificación de cuellos de botella

### CloudWatch
- Logs estructurados
- Métricas de Lambda
- Alertas automáticas

### Logging
- Logs estructurados en JSON
- Diferentes niveles de logging
- Contexto de request incluido

## 🔒 Seguridad

- Validación de entrada con Joi
- Sanitización de datos
- Límites en tamaños de entrada
- TTL automático en DynamoDB
- IAM roles con mínimos privilegios

## 🚀 Despliegue

### Despliegue a desarrollo
```bash
npm run deploy -- --stage dev
```

### Despliegue a producción
```bash
npm run deploy -- --stage prod
```

### Rollback
```bash
serverless rollback --stage prod
```

## 📈 Optimización de Costos

- **Lambda**: Timeout optimizado a 30s
- **DynamoDB**: Modo pay-per-request
- **Caché**: TTL de 30 minutos para reducir llamadas a APIs externas
- **Memoria**: 512MB para balance entre rendimiento y costo

## 🔄 Caché

El sistema implementa un sistema de caché de dos niveles:

1. **Caché en memoria**: Para servicios individuales (30 minutos)
2. **Caché en DynamoDB**: Para respuestas completas (30 minutos)

## 🐛 Troubleshooting

### Errores comunes

1. **Error de permisos DynamoDB**
   - Verificar IAM roles en `serverless.yml`
   - Confirmar que la tabla existe

2. **Timeout en Lambda**
   - Verificar configuración de timeout
   - Revisar logs de CloudWatch

3. **Error de validación**
   - Verificar formato de entrada
   - Revisar esquemas de validación

### Logs y debugging

```bash
# Ver logs en tiempo real
serverless logs -f api --tail

# Ver logs específicos
serverless logs -f api --startTime 1h
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Softtek Rimac** - *Desarrollo inicial*

## 🙏 Agradecimientos

- SWAPI por proporcionar datos de Star Wars
- WeatherAPI por datos meteorológicos
- AWS por la infraestructura serverless
- Comunidad de Serverless Framework

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de AWS

---

**Nota**: Esta API está diseñada para fines educativos y de demostración. Para uso en producción, considerar implementar autenticación, rate limiting y monitoreo adicional. 