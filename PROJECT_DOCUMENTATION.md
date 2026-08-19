# AgriSmart AI — Smart Farming Ecosystem Documentation

AgriSmart AI is a production-ready Web application designed to empower farmers with localized agronomic intelligence, crop lifecycle timeline tracking, APMC mandi wholesale commodity indices, machinery expense calculators, and AI diagnostics.

---

## 1. System Architecture

AgriSmart AI is architected as a distributed multi-tier system with decoupling between the presentation layer, business services, and database schemas.

```
                  ┌───────────────────────┐
                  │   React 19 Frontend   │
                  │   (Nginx / Vite)      │
                  └───────────┬───────────┘
                              │
                              │ REST HTTP Requests (Port 8000)
                              ▼
                  ┌───────────────────────┐
                  │  FastAPI REST Backend │
                  │  (Uvicorn ASGI App)   │
                  └──────┬─────────┬──────┘
                         │         │
    SQL ORM (asyncpg)    │         │ Redis Cache
    (Port 5432)          ▼         ▼ (Port 6379)
              ┌────────────┐     ┌────────────┐
              │ PostgreSQL │     │    Redis   │
              │  Database  │     │ Cache/Queue│
              └────────────┘     └────────────┘
```

### Decoupled Core Components
1. **Frontend**: A React 19, TypeScript single-page application built via Vite, styled with Tailwind CSS, and served in production using Nginx.
2. **Backend**: An asynchronous Python FastAPI application, running via Uvicorn, which serves REST endpoints, processes ML inferences, and coordinates DB schemas.
3. **Database**: PostgreSQL 15 database instance using SQLAlchemy 2.0 ORM and `asyncpg` async PostgreSQL driver.
4. **Cache & Queue**: Redis 7 cache server for background task routing and fast metadata caching.
5. **Machine Learning Engines**: Python libraries (Pandas, NumPy, Scikit-Learn, TensorFlow, OpenCV) executing random forest models and sequential Convolutional Neural Networks (CNNs).

---

## 2. Decoupled Clean Architecture (Backend)

The backend code conforms strictly to the principles of Clean Architecture:

```
+-------------------------------------------------------+
|                 Frameworks & Drivers                  |
|          FastAPI / SQLAlchemy Engine / Docker         |
|   +-----------------------------------------------+   |
|   |              Interface Adapters               |   |
|   |         Pydantic Schemas / Repositories       |   |
|   |   +---------------------------------------+   |   |
|   |   |               Use Cases               |   |   |
|   |   |      ML Recommendations / Auth flows   |   |   |
|   |   |   +-------------------------------+   |   |   |
|   |   |   |           Entities            |   |   |   |
|   |   |   |    SQLAlchemy Domain Models   |   |   |   |
|   |   |   +-------------------------------+   |   |   |
|   |   +---------------------------------------+   |   |
|   +-----------------------------------------------+   |
+-------------------------------------------------------+
```

*   **Entities (Domain Layer - `app/models/`)**: Contains the core database models (User, Farm, Crop, Expense) represented as SQLAlchemy declarations. These are free of REST router logic.
*   **Use Cases (Interactor Layer - `app/ml/` and `app/services/`)**: Performs core operations like training classifiers, predicting commodity pricing, and calculating warehouse holding periods.
*   **Interface Adapters (Repository Layer - `app/repositories/`)**: Abstract database operations from raw SQL queries. Standardizes methods like `get_by_email()`, `create()`, and `remove()`.
*   **Frameworks & Drivers (`app/api/`)**: FastAPI routers and endpoints that inject dependencies (such as active DB sessions or current authenticated users) and parse incoming Pydantic schemas.

---

## 3. Machine Learning Micro-Services

AgriSmart AI operates five distinct ML classifiers, regressors, and computer vision models trained separately and exposed as REST API endpoints under `/api/v1/ml/`.

### 3.1. Crop Recommendation Service
*   **Algorithm**: `RandomForestClassifier` (50 estimators, 10 max depth).
*   **Input Features**:
    *   `N` (Nitrogen content in soil, mg/kg)
    *   `P` (Phosphorus content in soil, mg/kg)
    *   `K` (Potassium content in soil, mg/kg)
    *   `temperature` (Celsius)
    *   `humidity` (Relative humidity %)
    *   `ph` (Soil pH)
    *   `rainfall` (Average annual rainfall, mm)
*   **Output**: Optimal crop category suitabilities (e.g. Rice, Banana, Cotton, Chickpea, Maize, Mango) and classifier probability confidence.

### 3.2. Harvest Yield Prediction Service
*   **Algorithm**: `RandomForestRegressor` (50 estimators, 8 max depth).
*   **Input Features**:
    *   `crop_name` (Mapped to category integer)
    *   `soil_type` (Mapped to soil integer)
    *   `acreage` (Land area, acres)
    *   `rainfall` (Current cycle rainfall, mm)
    *   `fertilizer_usage` (Total fertilizer used, kg)
*   **Output**: Estimated total crop harvest yield (Kg) and average crop productivity index per acre.

### 3.3. Wholesale Price Forecasting Service
*   **Algorithm**: `RandomForestRegressor` (50 estimators, 8 max depth).
*   **Input Features**:
    *   `crop_name` (Mapped to category integer)
    *   `mandi_name` (Target APMC Mandi, mapped to integer)
    *   `month` (Target calendar month, 1-12)
    *   `historical_price_avg` (Historical wholesale price index average, ₹/Qtl)
*   **Output**: Forecasted APMC wholesale commodity rate per quintal (₹/Qtl) and price per kg.

### 3.4. Leaf Disease Diagnosis Service
*   **Algorithm**: `Sequential CNN` (2D Convolution, Max Pooling, Flattening, Dense layers).
*   **Input**: $128 \times 128 \times 3$ Leaf photograph file upload.
*   **OpenCV Preprocessing**: Decode file bytes, resize to target dims, normalize RGB pixel values to $[0.0, 1.0]$.
*   **Output**: Diagnosis tag (Healthy, Leaf Spot, Late Blight, Powdery Mildew) and treatment advisories.

### 3.5. Smart Selling Recommendation Engine
*   **Algorithm**: Dynamic Warehouse Holding Simulation.
*   **Inputs**: Yield volume (kg), current market price (₹/kg), storage fee (₹/day), expected price trend (UP, DOWN, STABLE).
*   **Output**: Net profit projection matrix for holding 15, 30, 45 days and action advisory (HOLD vs SELL NOW).

---

## 4. Frontend Integrations

### 4.1. Voice Support (Speech to Text & Text to Speech)
*   **Speech to Text (Voice Typing)**: Implemented in the AI Assistant (`frontend/src/pages/Assistant.tsx`) using the browser-native Web Speech API `webkitSpeechRecognition`. Farmers can click the microphone to dictate messages.
*   **Text to Speech (Advisories Readout)**: Users can click the speaker icon next to AI assistant responses. It invokes `speechSynthesis` with `SpeechSynthesisUtterance` to read out agronomic and disease advices out loud.

### 4.2. Multi-Language Support
*   **Context Layer**: `LanguageContext.tsx` stores and toggles translation dictionaries (`en.json`, `hi.json`, `te.json`).
*   **Supported Languages**:
    *   **English (EN)**
    *   **Hindi (HI)**
    *   **Telugu (TE)**
*   **Global Selector**: A dropdown toggle is located in the main top header navigation bar (`Layout.tsx`), enabling immediate page translations on-the-fly.

---

## 5. Dockerization & Production Build

The system is configured to run inside containerized environments to ensure reproducibility.

### Local Docker Compose Orchestration
The root `docker-compose.yml` configures 4 micro-services:
1.  **agrismart_db**: PostgreSQL 15-alpine instance mapping port `5432` with a persistent database volume `postgres_data`.
2.  **agrismart_redis**: Redis 7-alpine cache server mapping port `6379` with `redis_data` volume.
3.  **agrismart_backend**: Gathers and compiles python dependencies from `requirements.txt`, copies backend scripts, and boots Uvicorn on port `8000`.
4.  **agrismart_frontend**: Multistage Docker build. Node builder compiles static JS assets. The output is injected into an Nginx base container serving on port `80`.

---

## 6. AWS Cloud Deployment Blueprint

AgriSmart AI can be deployed on AWS using serverless container technology (ECS Fargate) and managed database engines:
*   **DNS & Security**: Route 53 routes queries through an Application Load Balancer (ALB) enforcing ACM SSL/TLS certificates.
*   **Presentation & Core**: Elastic Container Service (ECS) Fargate runs task definitions for `agrismart-frontend` and `agrismart-backend` inside isolated private subnets.
*   **Database & Caching**: RDS PostgreSQL (version 15) handles relational tables, and ElastiCache serverless Redis acts as the caching layer.
*   **Secrets**: AWS System Manager (SSM) Parameter Store or AWS Secrets Manager injects environment keys like database URL and Gemini API credentials.
