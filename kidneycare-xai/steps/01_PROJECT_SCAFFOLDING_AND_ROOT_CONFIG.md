# Step 01: Project Scaffolding & Root Configuration

## 1. Overview & Objective
Before writing a single line of backend, frontend, or machine learning code, you must establish a clean, polyglot monorepo structure. A multi-tier clinical AI system comprises three distinct runtimes:
- **Python 3.10+** for machine learning inference and SHAP explainability.
- **Java 17 / Spring Boot 3** for enterprise orchestration, relational persistence, and security.
- **Node.js 18+ / React 19** for the responsive web interface.

This step establishes the root directory structure, Git exclusion rules (`.gitignore`), and project manifest files.

---

## 2. Prerequisites
- Installed Git (>= 2.30)
- Installed Node.js (>= 18), Java JDK 17, and Python (>= 3.10)

---

## 3. Why This Is Created Now
If you write code before setting up the `.gitignore` and folder hierarchy:
1. Compiled `.class` files, `target/` binaries, Python `__pycache__` artifacts, and bulky `node_modules/` folders will immediately pollute git commits.
2. Large ML models (`*.pkl`, `*.joblib`) or datasets containing sensitive health records could accidentally be committed to version control.
3. Establishing clean directory boundaries ensures independent microservices can be containerized separately.

---

## 4. Directory Structure to Initialize

Create the following folder hierarchy at the workspace root:

```
kidneycare-xai/
├── .gitignore
├── README.md
├── docker-compose.yml
├── docs/
│   ├── database/
│   └── api/
├── ml-service/
│   ├── app/
│   └── models/
├── backend-springboot/
│   └── src/
│       ├── main/
│       │   ├── java/com/kidneycare/
│       │   └── resources/
│       └── test/
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── context/
│       └── pages/
└── research/
    ├── questionnaire/
    └── literature/
```

### PowerShell Command to Create Structure
```powershell
mkdir kidneycare-xai
cd kidneycare-xai
mkdir -p docs/database docs/api
mkdir -p ml-service/app ml-service/models
mkdir -p backend-springboot/src/main/java/com/kidneycare backend-springboot/src/main/resources backend-springboot/src/test
mkdir -p frontend/public frontend/src/api frontend/src/assets frontend/src/components frontend/src/context frontend/src/pages
mkdir -p research/questionnaire research/literature
```

---

## 5. File Contents & Detailed Explanation

### 5.1 `.gitignore`
Create `kidneycare-xai/.gitignore`:
```gitignore
# ========================
# Java / Spring Boot
# ========================
backend-springboot/target/
backend-springboot/*.jar
backend-springboot/*.war
backend-springboot/.mvn/
backend-springboot/mvnw
backend-springboot/mvnw.cmd

# ========================
# Python / ML Service
# ========================
ml-service/__pycache__/
ml-service/**/__pycache__/
ml-service/*.pyc
ml-service/.venv/
ml-service/venv/
ml-service/env/
ml-service/*.egg-info/
ml-service/.eggs/
ml-service/dist/
ml-service/build/
ml-service/.ipynb_checkpoints/
ml-service/notebooks/.ipynb_checkpoints/

# ========================
# Node / React
# ========================
frontend/node_modules/
frontend/dist/
frontend/.cache/
frontend/.parcel-cache/

# ========================
# Environment / Secrets
# ========================
.env
.env.local
.env.*.local
*.env
!.env.example

# ========================
# IDE
# ========================
.idea/
*.iml
.vscode/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# ========================
# Docker
# ========================
docker-compose.override.yml

# ========================
# Database / Local volumes
# ========================
postgres_data/
*.sql.bak

# ========================
# Large Machine Learning Models (>100MB)
# ========================
ml-service/models/*.pkl
ml-service/models/*.joblib
ml-service/models/*.bin
!ml-service/models/.gitkeep

# ========================
# Research Data / Datasets
# ========================
research/data/*.csv
research/data/*.xlsx
research/data/*.parquet
!research/data/.gitkeep
```

### Explanation of Rules:
- `backend-springboot/target/`: Spring Boot compiles `.java` source code into `.class` files and bundled `.jar` packages here.
- `ml-service/**/__pycache__/`: Python generates compiled bytecode caches.
- `frontend/node_modules/`: Vite / npm installs third-party JavaScript dependencies here.
- `ml-service/models/*.pkl`: ML model weights can be tens or hundreds of megabytes. Tracking them in standard git leads to severe repository bloat.
- `!.env.example`: Ignores actual environment secrets while allowing documentation templates.

---

## 6. Verification
Run the following git status command in terminal:
```powershell
git status
```
Verify that Git detects the new directory structure, and that temporary files like `target/` or `node_modules/` are cleanly ignored.

---

## 7. Next Step Dependency
Now that our root layout is established, proceed to **`02_DATABASE_SCHEMA_AND_RELATIONAL_DESIGN.md`** to create the relational database schema in `docs/database/schema.sql`. The database schema forms the data foundation upon which both the ML features and Spring Boot JPA entities are built.
