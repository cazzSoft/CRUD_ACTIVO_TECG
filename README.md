# CRUD seguro de activos tecnologicos

API REST desarrollada con Node.js y SQLite para gestionar un inventario de activos tecnologicos, como laptops, monitores, impresoras, routers o proyectores.

Este proyecto aplica principios basicos de SSDLC durante la fase de implementacion: validacion estricta de entradas, uso de UUID, consultas parametrizadas, logging seguro, limite de tamano de peticiones, validacion de tipo MIME y manejo controlado de errores.

## Objetivos de la actividad

- Aplicar principios de SSDLC en la fase de implementacion.
- Implementar tecnicas basicas de seguridad en endpoints CRUD.
- Usar UUID como identificador unico de cada recurso.
- Prevenir inyecciones mediante consultas parametrizadas.
- Registrar eventos relevantes sin almacenar informacion sensible en texto plano.
- Evitar exponer informacion interna del servidor en mensajes de error.

## Tecnologia utilizada

- Node.js
- SQLite
- SQLite nativo de Node.js (`node:sqlite`)
- Servidor HTTP nativo de Node.js
- Validacion propia sin dependencias externas
- Logging seguro en archivo JSON Lines

## Persistencia de datos

Los datos se almacenan en una base de datos SQLite local. Por defecto se usa una ruta fuera de OneDrive para evitar bloqueos de escritura en carpetas sincronizadas:

```txt
%TEMP%/crud-activos-seguros/database.sqlite
```

Tambien se puede definir una ruta personalizada con la variable de entorno `DB_FILE`. SQLite fue elegido porque no requiere un servidor externo, es suficiente para un CRUD simple y permite usar consultas parametrizadas para prevenir inyecciones SQL.

La tabla principal se llama `assets`:

```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  serialNumber TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  location TEXT NOT NULL,
  purchaseDate TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

## Instalacion y ejecucion

Este proyecto no requiere instalar dependencias externas. Puede ejecutarse directamente con Node.js.

En Windows PowerShell:

```bash
npm start
```

Requiere Node.js 22.5 o superior porque utiliza el modulo nativo `node:sqlite`.

Si deseas cambiar la configuracion, define variables de entorno como `PORT`, `NODE_ENV`, `DB_FILE` o `LOG_LEVEL` antes de ejecutar el servidor. El archivo `.env.example` se incluye como referencia.

Ejemplo para guardar la base dentro de otra carpeta:

```powershell
$env:DB_FILE="C:\temp\crud-activos.sqlite"
npm start
```

Servidor por defecto:

```txt
http://localhost:3000
```

Interfaz web de prueba:

```txt
http://localhost:3000/
```

Tambien puedes probar la API directamente con:

```txt
http://localhost:3000/health
```

## Recurso gestionado

El recurso principal es un activo tecnologico:

```json
{
  "id": "c8e9f5d2-7f8e-4f3c-b4d6-91f54f3bb3c7",
  "name": "Laptop Dell Latitude 5440",
  "category": "laptop",
  "serialNumber": "DL-2026-AX91",
  "status": "available",
  "location": "Laboratorio 1",
  "purchaseDate": "2026-05-20",
  "createdAt": "2026-06-15T20:00:00.000Z",
  "updatedAt": "2026-06-15T20:00:00.000Z"
}
```

## Endpoints

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/api/assets` | Lista todos los activos tecnologicos |
| GET | `/api/assets/:id` | Obtiene un activo por UUID |
| POST | `/api/assets` | Crea un nuevo activo |
| PUT | `/api/assets/:id` | Actualiza un activo existente |
| DELETE | `/api/assets/:id` | Elimina un activo existente |

## Validaciones aplicadas

| Campo | Tipo | Validacion |
|---|---|---|
| `id` | UUID | Debe ser un UUID valido en endpoints con parametro |
| `name` | String | Obligatorio, entre 3 y 100 caracteres, sin caracteres `<` ni `>` |
| `category` | Enum | Solo permite `laptop`, `desktop`, `monitor`, `printer`, `router`, `projector`, `other` |
| `serialNumber` | String | Obligatorio, unico, entre 5 y 50 caracteres, solo letras, numeros y guiones |
| `status` | Enum | Solo permite `available`, `assigned`, `maintenance`, `retired` |
| `location` | String | Obligatorio, entre 3 y 80 caracteres, sin caracteres `<` ni `>` |
| `purchaseDate` | Date string | Obligatorio, fecha valida en formato `YYYY-MM-DD` |

El esquema de validacion rechaza campos adicionales no definidos. Esto reduce el riesgo de recibir datos inesperados.

## Controles de seguridad por endpoint

| Endpoint | Validacion estricta | UUID | Consultas parametrizadas | Logging seguro | Proteccion adicional |
|---|---|---|---|---|---|
| `GET /api/assets` | No recibe body | No aplica | Si | Registra acceso al listado sin datos sensibles | Respuesta controlada y sin errores internos |
| `GET /api/assets/:id` | Valida parametro de ruta | Valida que `id` sea UUID | Si | Registra lectura usando solo el UUID del recurso | Mensaje generico si no existe |
| `POST /api/assets` | Valida tipo, longitud, formato y valores permitidos | Genera UUID v4 con `crypto.randomUUID()` | Si | Registra creacion sin guardar el body completo | Limite JSON 10kb, exige `Content-Type: application/json`, rechaza campos extra |
| `PUT /api/assets/:id` | Valida UUID y body completo | Valida que `id` sea UUID | Si | Registra modificacion usando solo el UUID del recurso | Limite JSON 10kb, exige `Content-Type: application/json`, rechaza campos extra |
| `DELETE /api/assets/:id` | Valida parametro de ruta | Valida que `id` sea UUID | Si | Registra eliminacion usando solo el UUID del recurso | Respuesta 204 sin exponer informacion interna |

## Ejemplos de uso

Crear un activo:

```bash
curl -X POST http://localhost:3000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell Latitude 5440",
    "category": "laptop",
    "serialNumber": "DL-2026-AX91",
    "status": "available",
    "location": "Laboratorio 1",
    "purchaseDate": "2026-05-20"
  }'
```

Listar activos:

```bash
curl http://localhost:3000/api/assets
```

Consultar un activo por UUID:

```bash
curl http://localhost:3000/api/assets/c8e9f5d2-7f8e-4f3c-b4d6-91f54f3bb3c7
```

Actualizar un activo:

```bash
curl -X PUT http://localhost:3000/api/assets/c8e9f5d2-7f8e-4f3c-b4d6-91f54f3bb3c7 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell Latitude 5440",
    "category": "laptop",
    "serialNumber": "DL-2026-AX91",
    "status": "maintenance",
    "location": "Soporte Tecnico",
    "purchaseDate": "2026-05-20"
  }'
```

Eliminar un activo:

```bash
curl -X DELETE http://localhost:3000/api/assets/c8e9f5d2-7f8e-4f3c-b4d6-91f54f3bb3c7
```

## Logging seguro

El sistema registra eventos relevantes como accesos, creaciones, modificaciones, eliminaciones y errores. Los logs no almacenan contrasenas, tokens, informacion personal ni el cuerpo completo de las peticiones.

Los logs se guardan en:

```txt
logs/application.log
```

Ejemplo de informacion registrada:

```json
{
  "event": "asset_created",
  "resourceId": "c8e9f5d2-7f8e-4f3c-b4d6-91f54f3bb3c7",
  "method": "POST",
  "path": "/api/assets",
  "statusCode": 201
}
```

## Medidas SSDLC aplicadas

| Principio SSDLC | Aplicacion en el proyecto |
|---|---|
| Diseno seguro | Se definieron campos permitidos, valores validos y uso obligatorio de UUID |
| Implementacion segura | Se usan validadores propios, consultas parametrizadas y cabeceras HTTP de seguridad |
| Defensa en profundidad | La API valida datos y la base de datos tambien usa restricciones `CHECK` y `UNIQUE` |
| Manejo seguro de errores | No se exponen stack traces ni errores internos de SQLite |
| Trazabilidad | Se registran eventos relevantes sin guardar datos sensibles |
| Minimizacion de superficie | Solo existen endpoints necesarios para el CRUD |

## Notas de seguridad

- No se implementa autenticacion ni control de roles porque la guia indica aplicar seguridad basica sin esos mecanismos.
- Los UUID evitan enumeracion sencilla de recursos.
- El limite de `10kb` reduce el riesgo de abuso por cuerpos de peticion demasiado grandes.
- El middleware de tipo MIME rechaza `POST` y `PUT` que no usen `application/json`.
- Los mensajes de error son controlados para no revelar detalles internos del servidor.
