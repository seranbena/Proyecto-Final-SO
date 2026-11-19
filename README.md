# Trabajo final · Corte 3 · Sistemas Operativos 103027

Código base. **No hay que programar nada**: hay que desplegarlo y conectarlo.
El enunciado completo está en el documento del trabajo final.

```
frontend/          Parte 1 · AWS EC2 con Nginx (sin Docker)
  index.html       página que muestra la tabla
  config.js        ← aquí va la URL de tu API
backend/           Parte 2 · Azure con Docker
  app.py           API en Flask con 2 endpoints
  requirements.txt dependencias
  .env.example     variables que necesita (cópialo a .env)
db/
  init.sql         crea la tabla y carga los datos
```

Endpoints de la API:

| Ruta | Responde |
|---|---|
| `GET /api/salud` | `{"estado": "ok"}` si la base de datos contesta |
| `GET /api/sistemas` | la lista de sistemas operativos guardada en la base de datos |

Lo que te toca escribir a ti: el `Dockerfile` del backend, el `compose.yaml` de Azure
y la configuración de Nginx de cada servidor.

## Cómo levantarlo en local

Sirve para probar que todo funciona antes de desplegar. Necesitas **Docker** y **Python 3.10+**.
Abre tres terminales, todas en la raíz del proyecto.

**1. Base de datos (terminal 1)**

```bash
docker run --rm --name so-db -p 5432:5432 \
  -e POSTGRES_USER=so -e POSTGRES_PASSWORD=so -e POSTGRES_DB=so \
  -v "$PWD/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  postgres:16
```

`init.sql` crea la tabla y carga los datos al arrancar. Como el contenedor no usa volumen,
cada vez que lo reinicias empieza desde cero.

**2. Backend (terminal 2)**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

export DATABASE_URL=postgresql://so:so@localhost:5432/so
export ORIGEN_PERMITIDO=http://localhost:8080
flask --app app run --port 8000
```

Comprueba que responde:

```bash
curl http://localhost:8000/api/salud      # {"estado":"ok"}
curl http://localhost:8000/api/sistemas   # lista de sistemas operativos
```

> Flask no lee el archivo `.env` por sí solo, por eso en local se usan `export`.

**3. Frontend (terminal 3)**

Cambia temporalmente `frontend/config.js` para que apunte a tu API local:

```js
const API_URL = "http://localhost:8000";
```

Y sírvelo:

```bash
cd frontend
python3 -m http.server 8080
```

Abre <http://localhost:8080>: debe aparecer la tabla. Si sale vacía, abre la consola del
navegador (F12). Un error de CORS significa que `ORIGEN_PERMITIDO` no coincide exactamente
con `http://localhost:8080`.

> Antes de desplegar, vuelve a poner en `config.js` la URL pública de tu backend en Azure.

**Para apagar todo:** `Ctrl+C` en cada terminal. El contenedor de Postgres se borra solo (`--rm`).
