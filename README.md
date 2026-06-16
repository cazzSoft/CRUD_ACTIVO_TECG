# CRUD seguro de activos tecnologicos

Proyecto practico para gestionar activos tecnologicos mediante una API REST y una interfaz web sencilla.

Repositorio: https://github.com/cazzSoft/CRUD_ACTIVO_TECG

## Que incluye

- CRUD de activos tecnologicos.
- Identificadores UUID para cada registro.
- Base de datos SQLite.
- Validacion de datos de entrada.
- Consultas parametrizadas.
- Logging de eventos sin guardar el cuerpo completo de las peticiones.
- Interfaz web para probar el CRUD desde el navegador.

## Requisitos

- Node.js 22.5 o superior.
- No requiere instalar dependencias externas.

## Ejecucion

```bash
npm start
```

Servidor:

```txt
http://localhost:3000
```

Interfaz web:

```txt
http://localhost:3000/
```

Prueba rapida de la API:

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{"status":"ok"}
```

## Recurso

El CRUD trabaja con activos tecnologicos. Ejemplo:

```json
{
  "name": "Laptop Dell Latitude 5420",
  "category": "laptop",
  "serialNumber": "DELL-LAT-5420-001",
  "status": "available",
  "location": "Departamento de Sistemas",
  "purchaseDate": "2026-06-15"
}
```

Valores permitidos:

- `category`: `laptop`, `desktop`, `monitor`, `printer`, `router`, `projector`, `other`
- `status`: `available`, `assigned`, `maintenance`, `retired`
- `purchaseDate`: formato `YYYY-MM-DD`

## Endpoints

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/health` | Verificar que el servidor esta activo |
| GET | `/api/assets` | Listar activos |
| GET | `/api/assets/:id` | Consultar un activo por UUID |
| POST | `/api/assets` | Crear un activo |
| PUT | `/api/assets/:id` | Actualizar un activo |
| DELETE | `/api/assets/:id` | Eliminar un activo |

## Controles aplicados

| Endpoint | Controles |
|---|---|
| `GET /api/assets` | Consulta parametrizada y registro del acceso |
| `GET /api/assets/:id` | Validacion de UUID, consulta parametrizada y error controlado si no existe |
| `POST /api/assets` | Validacion de campos, UUID generado en servidor, limite de 10 KB, Content-Type JSON, consulta parametrizada y logging |
| `PUT /api/assets/:id` | Validacion de UUID, validacion del body, limite de 10 KB, Content-Type JSON, consulta parametrizada y logging |
| `DELETE /api/assets/:id` | Validacion de UUID, consulta parametrizada, logging y respuesta sin exponer datos internos |

## Ejemplos con curl

Crear:

```bash
curl -X POST http://localhost:3000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell Latitude 5420",
    "category": "laptop",
    "serialNumber": "DELL-LAT-5420-001",
    "status": "available",
    "location": "Departamento de Sistemas",
    "purchaseDate": "2026-06-15"
  }'
```

Listar:

```bash
curl http://localhost:3000/api/assets
```

Actualizar:

```bash
curl -X PUT http://localhost:3000/api/assets/UUID_DEL_ACTIVO \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell Latitude 5420",
    "category": "laptop",
    "serialNumber": "DELL-LAT-5420-001",
    "status": "maintenance",
    "location": "Soporte Tecnico",
    "purchaseDate": "2026-06-15"
  }'
```

Eliminar:

```bash
curl -X DELETE http://localhost:3000/api/assets/UUID_DEL_ACTIVO
```

## Scripts

```bash
npm run check
npm run test:smoke
```

`check` revisa sintaxis de archivos principales. `test:smoke` prueba el flujo basico del CRUD.
