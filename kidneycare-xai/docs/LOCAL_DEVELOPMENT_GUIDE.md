# Local development on Windows

Use PowerShell 7.2 or newer from the application directory, `kidneycare-xai`. The scripts select Docker Desktop when its Linux engine is available. Pass `-Mode Native` to run all four services on Windows.

## Docker Desktop

Start Docker Desktop in Linux container mode. Run the following from the application directory.

```powershell
./scripts/setup-local.ps1 -Mode Docker
./scripts/start-local.ps1 -Mode Docker
./scripts/check-local.ps1 -Mode Docker
./scripts/stop-local.ps1 -Mode Docker
```

Open the URL reported by the start script. It defaults to `http://127.0.0.1:3000`. Nginx serves React and proxies `/api` to Spring. Spring authenticates internal FastAPI requests with the shared local secret. The database and application services communicate through the Docker network. The frontend is the only service with a published port.

Compose uses PostgreSQL 15 with pgvector, Python 3.11, Java 17, and Node.js 24. The database health check gates the one-shot migration service. A successful migration gates FastAPI and Spring. The final frontend check requests the evaluation endpoint through the same proxy the browser uses.

### Existing Docker database

The project name is `kidneycare-xai`, and the named volume is `kidneycare-xai_postgres_data`. If you previously ran Compose with custom project or volume names, identify the existing volume and back it up before adopting it. The local script's default project name will create its own volume if that volume does not exist.

Before startup against an existing volume, set `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` in `.env.development.local` to the database values used when that volume was initialized. Creating the development config generates a password for a new cluster. PostgreSQL keeps the original credentials in an initialized volume. Changing environment values does not change that password.

The migration runner uses one transaction and a database advisory lock. It applies the bootstrap only when the public schema has no application or unrelated user relations, and applies additive V2–V5 migrations to fresh and recognized existing schemas. Hibernate schema changes are disabled. `stop-local.ps1` leaves the named volume in place.

## Native Windows

Install JDK 17, Maven 3.9, Python 3.11, Node.js 24 LTS, and PostgreSQL 15 command-line/server binaries. Add Maven, Node, and the PostgreSQL `bin` directory containing `psql.exe`, `pg_ctl.exe`, and `initdb.exe` to `PATH`. Set `JAVA_HOME` to a JDK 17 installation when it is outside the usual locations. If the Python launcher cannot locate 3.11, set `KIDNEYCARE_PYTHON` to the 3.11 executable.

```powershell
./scripts/setup-local.ps1 -Mode Native
./scripts/start-local.ps1 -Mode Native
./scripts/check-local.ps1 -Mode Native
./scripts/stop-local.ps1 -Mode Native
```

Setup creates or reuses `ml-service/.venv` (set `KIDNEYCARE_VENV` to the absolute path of a separate 3.11 environment to keep an older environment intact), installs Python requirements, and runs `npm ci`. Startup packages Spring, initializes a dedicated PostgreSQL cluster in the ignored `logs/local/postgres` directory if needed, migrates it, then starts FastAPI, Spring and Vite. Every listener binds to loopback. The script checks the cluster's data directory before creating a database or applying migrations. It records each child PID with its start time and checks that identity before stopping that process tree. Native shutdown preserves the cluster. Development output is in `logs/local`.

Change `FRONTEND_PORT`, `SERVER_PORT`, `ML_PORT`, or `DB_PORT` in `.env.development.local` while the stack is stopped. The four native ports must be distinct. The Docker path uses only `FRONTEND_PORT` for its published listener. Other default ports are 8080 for Spring, 8000 for FastAPI, and 55432 for native PostgreSQL.

## Configuration and health

Setup writes the ignored `.env.development.local` and `.env.auth.local` files only if missing. Keep the existing local auth file to retain its JWT signing key and internal service credential. Use plain `KEY=value` lines in the development file. The scripts derive `DB_URL` and `ML_SERVICE_URL` from local topology, and set the frontend API base to `/api`. An unrelated application `.env` is not required.

The default assistant uses `ASSISTANT_PROVIDER=mock` and `ASSISTANT_RETRIEVER=fixture`. For an explicitly enabled local Gemini session, configure `ASSISTANT_PROVIDER=gemini`, `ASSISTANT_MODEL`, and a development-only `GEMINI_API_KEY`. Send synthetic content only. Leave `ASSISTANT_SYNTHETIC_RESEARCH` empty unless deliberately running the synthetic research endpoint. Conversational research additionally needs `ASSISTANT_CONVERSATIONAL_RESEARCH=enabled` and explicit `ASSISTANT_SYNTHETIC_ACCOUNTS` containing only approved synthetic account email addresses.

Pgvector retrieval also needs psycopg, sentence-transformers, a locally available embedding model, a local DSN, and initial knowledge ingestion with `python -m app.knowledge`. Compose installs the PostgreSQL extension during migration. Setting `ASSISTANT_RETRIEVER=pgvector` in Compose includes the optional Python dependencies. Put the approved embedding model in the existing models bind mount, use its container path for `ASSISTANT_EMBEDDING_MODEL`, and set `ASSISTANT_KB_DSN` to the PostgreSQL URI for the internal `db` service. Run ingestion inside the ML container before using the retriever. On Native, install the matching PostgreSQL extension and `ml-service/requirements-assistant.txt` in the virtual environment. Leave the DSN empty so startup derives it from the dedicated cluster. The default fixture retrieval requires neither vector dependencies nor a model download.

A successful check reaches the frontend and the proxied API. In Native mode it also checks a migrated table, confirms FastAPI loaded the model, and verifies that FastAPI rejects an internal call without its secret. The evaluation route may explicitly report unavailable metrics if the checked-in report and artifacts do not match. Check native `logs/local` for startup details or use Docker Desktop's Containers pane. Avoid printing configuration files or expanded Compose configuration when sharing diagnostic output.
