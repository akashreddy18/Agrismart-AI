# Deployment Guide: AgriSmart AI

This guide contains instructions on how to configure, train, and run the AgriSmart AI application locally or in a containerized production environment.

---

## 1. Environment Configurations

Both local and Docker-based setups rely on environment variables. In production, configure these variables in your deployment controller (such as AWS ECS Task Definition or Kubernetes ConfigMaps).

Configure the `./backend/.env` file with the following variables:
```env
PROJECT_NAME="AgriSmart AI"
API_V1_STR="/api/v1"
SECRET_KEY="c3VwZXJzZWNyZXRrZXlmb3JhZ3Jpc21hcnRhaXByb2R1Y3Rpb25xdWFsaXR5"
ACCESS_TOKEN_EXPIRE_MINUTES=11520
DATABASE_URL="postgresql+asyncpg://agrismart_user:agrismart_password@localhost:5432/agrismart_db"
REDIS_URL="redis://localhost:6379/0"
GEMINI_API_KEY="your_google_gemini_api_key_here"
```

---

## 2. Option A: Local Development Deployment (Windows / Linux)

### 2.1. Backend Setup
Ensure you have **Python 3.11** installed.

1.  **Navigate to backend directory**:
    ```bash
    cd backend
    ```
2.  **Create virtual environment**:
    ```bash
    py -3.11 -m venv venv
    ```
3.  **Activate virtual environment**:
    *   **Windows (PowerShell)**:
        ```powershell
        .\venv\Scripts\activate
        ```
    *   **Linux / macOS**:
        ```bash
        source venv/bin/activate
        ```
4.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
5.  **Train Machine Learning models**:
    Train each classifier/regressor/CNN model separately by running their training scripts:
    ```bash
    python -m app.ml.training.train_crop_recommendation
    python -m app.ml.training.train_yield_prediction
    python -m app.ml.training.train_price_prediction
    python -m app.ml.training.train_disease_detection
    ```
    This generates binary model files inside `backend/app/ml/models/`.
6.  **Run backend server**:
    ```bash
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
    ```

### 2.2. Frontend Setup
Ensure you have **Node.js v20+** installed.

1.  **Navigate to frontend directory**:
    ```bash
    cd frontend
    ```
2.  **Install node dependencies**:
    ```bash
    npm install
    ```
3.  **Run frontend dev server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 3. Option B: Containerized Orchestration (Docker Compose)

The production-ready stack maps DB, Redis, Backend, and Frontend containers automatically.

1.  **Ensure Docker Desktop is running**.
2.  **Boot the multi-container stack**:
    Run this command in the root workspace directory (where `docker-compose.yml` resides):
    ```bash
    docker-compose up --build
    ```
3.  **Train models inside the container**:
    Since models are saved as binary models in the container directory, run the training commands within the running backend container:
    ```bash
    docker exec -it agrismart_backend python -m app.ml.training.train_crop_recommendation
    docker exec -it agrismart_backend python -m app.ml.training.train_yield_prediction
    docker exec -it agrismart_backend python -m app.ml.training.train_price_prediction
    docker exec -it agrismart_backend python -m app.ml.training.train_disease_detection
    ```
    Alternatively, models will automatically compile on-the-fly when endpoints are queried if they are not pre-trained.

---

## 4. REST API Swagger Documentation

FastAPI compiles details for all active routes on startup. 
*   **Swagger Interactive UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **ReDoc Layout**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
*   **OpenAPI Schema**: [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

---

## 5. Verification Suite

Validate your local setup using the integration and ML unit test suites:
```bash
# Run ML services test suite (includes model training triggers)
python -m unittest tests/test_ml_services.py

# Run Crop lifecycle logs tests
python tests/test_crop_management.py

# Run Expenses ledger tests
python tests/test_expense_management.py
```
