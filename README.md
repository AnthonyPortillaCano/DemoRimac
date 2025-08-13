# Softtek Rimac API

Una API RESTful desarrollada con Node.js 20, TypeScript y Serverless Framework que integra la API de Star Wars (SWAPI) con una API meteorológica, fusionando datos y proporcionando funcionalidades de almacenamiento y consulta.

## 🚀 Características

- **Integración de APIs**: Combina datos de SWAPI y WeatherAPI
- **Fusión de datos**: Crea modelos unificados con información de personajes y clima
- **Sistema de caché**: Implementa caché de 30 minutos para optimizar rendimiento (persistido en base de datos)
- **Base de datos**: Almacenamiento en DynamoDB (por defecto) o MySQL (configurable)
- **Validación**: Validación robusta de entrada con Joi
- **Logging**: Sistema de logging estructurado con Winston
- **Trazabilidad**: Soporte para AWS X-Ray
- **Testing**: Pruebas unitarias y de integración con Jest
- **Autenticación**: JWT para proteger endpoints sensibles (bonus)
- **Rate limiting**: Límite de solicitudes para evitar abuso en endpoints externos (bonus)

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────────────┐
│   API Gateway  │───▶│   AWS Lambda    │───▶│   DynamoDB ó MySQL       │
└─────────────────┘    └─────────────────┘    └──────────────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Services      │
                       │  - Star Wars    │
                       │  - Weather      │
                       │  - Fusion       │
                       │  - Persistence  │
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
Almacena información personalizada en la base de datos. Requiere autenticación (JWT) cuando está habilitada.

**Headers:** `Authorization: Bearer <token>`

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
Consulta el historial de datos almacenados con paginación. Requiere autenticación (JWT) cuando está habilitada.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
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

### Endpoints de autenticación (bonus)

- `POST /auth/login` — Body: `{ "email": "...", "password": "..." }`
- `POST /auth/register` — Body: `{ "email": "...", "password": "...", "role": "user|admin" }` (requiere MySQL configurado)
- `GET /auth/token?role=user|admin` — Genera token de demo para pruebas

## 🔌 Ejemplos con curl

Base URL local: `http://localhost:3000/dev`

- Login (demo user)
```bash
curl -s -X POST http://localhost:3000/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'
```

- Login (MySQL user registrado)
```bash
curl -s -X POST http://localhost:3000/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@correo.com","password":"tuPassword"}'
```

- Obtener token de demo (admin)
```bash
curl -s "http://localhost:3000/dev/auth/token?role=admin"
```

- Fusionados (GET)
```bash
curl -s http://localhost:3000/dev/fusionados
```

- Almacenar (POST) con JWT
```bash
TOKEN="<pega_aqui_tu_token>"
curl -s -X POST http://localhost:3000/dev/almacenar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Mi Nota",
    "description":"Descripción",
    "category":"personal",
    "tags":["importante"],
    "metadata":{"priority":"high"}
  }'
```

- Historial (GET) con JWT
```bash
TOKEN="<pega_aqui_tu_token>"
curl -s "http://localhost:3000/dev/historial?page=1&limit=10&type=fused" \
  -H "Authorization: Bearer $TOKEN"
```

## ⚡ Quickstart local con MySQL

1) Configura `env.development`:
```env
DB_ENGINE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=<tu_usuario>
MYSQL_PASSWORD=<tu_password>
MYSQL_DATABASE=softtek_rimac
```

2) Arranca en modo desarrollo (Windows PowerShell):
```powershell
$env:NODE_ENV='development'; npm run dev
```

3) Registra un usuario y haz login:
```bash
# Register (crea DB y tabla users si no existen)
curl -s -X POST http://localhost:3000/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@correo.com","password":"TuPass123","role":"user"}'

# Login
curl -s -X POST http://localhost:3000/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@correo.com","password":"TuPass123"}'
```

4) Usa el token para llamar endpoints protegidos (`/almacenar` y `/historial`).

## 🛠️ Tecnologías

- **Runtime**: Node.js 20
- **Framework**: Serverless Framework
- **Lenguaje**: TypeScript
- **Base de datos**: Amazon DynamoDB o MySQL (configurable por entorno)
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
- Serverless Framework instalado globalmente
- (Opcional) AWS CLI configurado para despliegues a AWS

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
cp env.development .env.development
# o edita env.development directamente
```

Variables clave:
- Para DynamoDB (por defecto): `DB_ENGINE=dynamo`
- Para MySQL local: `DB_ENGINE=mysql` y configurar `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

4. **Ejecutar en modo desarrollo (offline)**
```bash
npm run dev
```

5. **Ejecutar pruebas**
```bash
npm test
npm run test:coverage
```

6. **Desplegar a AWS** (requiere credenciales AWS configuradas)
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
| `DB_ENGINE` | Motor de persistencia: `dynamo` o `mysql` | `dynamo` |
| `MYSQL_HOST` | Host MySQL (si `DB_ENGINE=mysql`) | `''` |
| `MYSQL_PORT` | Puerto MySQL | `3306` |
| `MYSQL_USER` | Usuario MySQL | `''` |
| `MYSQL_PASSWORD` | Password MySQL | `''` |
| `MYSQL_DATABASE` | Base de datos MySQL | `''` |
| `MYSQL_TABLE` | Tabla MySQL para items | `items` |
| `JWT_SECRET` | Secreto para firmar JWT | `your-secret-key-change-in-production` |

### Configuración de Serverless

El archivo `serverless.yml` incluye:
- Configuración de Lambda con timeout de 15s y 256MB de memoria
- Configuración de DynamoDB con índices globales
- Soporte para X-Ray y CORS
- Empaquetado con esbuild (minify)

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
- Trazabilidad de requests (habilitado en funciones; instrumentación adicional opcional)

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

- **Lambda**: Timeout optimizado a 15s
- **DynamoDB**: Modo pay-per-request
- **Caché**: TTL de 30 minutos para reducir llamadas a APIs externas
- **Memoria**: 256MB para balance entre rendimiento y costo

## 🔄 Caché

La API utiliza un caché persistido en la base de datos (DynamoDB o MySQL) por 30 minutos para evitar llamadas repetidas a las APIs externas.

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