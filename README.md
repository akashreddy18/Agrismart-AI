# AgriSmart AI — Smart Farming Ecosystem

AgriSmart AI is a production-ready Web application designed to empower farmers with localized agronomic intelligence, crop lifecycle timeline management, wholesale Mandi commodity indexes, machinery expense ledger calculators, and Leaf Disease CNN Diagnostics.

---

## 1. Tech Stack Overview

### Frontend
*   **Core**: React 19, TypeScript, React Router 7
*   **Styling**: Vanilla CSS with modern HSL palettes (Tailwind CSS utilized in UI)
*   **Charts**: Chart.js & React-Chartjs-2 for expense distributions and price sparklines.
*   **Audio**: Web Speech API (`speechSynthesis` and `webkitSpeechRecognition`) for voice typing and advisories readout.
*   **Localization**: Context-based localization layer supporting English (EN), Hindi (HI), and Telugu (TE).

### Backend
*   **Framework**: FastAPI (Asynchronous REST API)
*   **Database ORM**: SQLAlchemy 2 (Asyncio) with asyncpg driver
*   **Storage**: PostgreSQL 15 & Redis 7 cache
*   **Authentication**: OAuth2 Password Flow with JWT Session tokens

### Machine Learning
*   **Data Science**: Pandas, NumPy
*   **Modeling/Regression**: Scikit-Learn (Random Forests and Gradient Boosting)
*   **Disease Detection**: OpenCV (image resizing and preprocessing) & TensorFlow (Sequential Convolutional Neural Networks)

---

## 2. Decoupled Clean Architecture

The backend repository complies with Clean Architecture principles, ensuring that business entities, database concerns, and web frameworks are fully decoupled.

```
┌────────────────────────────────────────────────────────┐
|               Frameworks & Drivers                     |
|  FastAPI Router / SQLAlchemy Async / Docker / Nginx    |
|  ┌──────────────────────────────────────────────────┐  |
|  │               Interface Adapters                 │  │
|  │   Concrete Repositories / Pydantic DTO Schemas   │  │
|  │  ┌────────────────────────────────────────────┐  │  │
|  │  │                  Use Cases                 │  │  │
|  │  │   RegisterUser / PredictYield / ML Inter   │  │  │
|  │  │  ┌──────────────────────────────────────┐  │  │  │
|  │  │  │                Entities              │  │  │  │
|  │  │  │   User / Farm / Crop / Expense DB    │  │  │  │
|  │  │  └──────────────────────────────────────┘  │  │  │
|  │  └────────────────────────────────────────────┘  │  │
|  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

*   **Entities (Domain Layer)**: Pure SQLAlchemy schemas (`app/models/`) containing the core data properties.
*   **Use Cases (Interactor Layer)**: Pure Python use case classes orchestrating operations independent of routers.
*   **Interface Adapters (Repository Layer)**: DB access (`app/repositories/`) implementing abstract base interfaces.
*   **Frameworks & Drivers**: Web router endpoints (`app/api/`) resolving use cases using FastAPI Dependency Injection.

---

## 3. Machine Learning Models Summary

The platform operates five separate machine learning engines:

| Service | Algorithm | Feature Inputs | Output Results |
| :--- | :--- | :--- | :--- |
| **Crop Recommendation** | `RandomForestClassifier` | N, P, K, Temp, Humidity, pH, Rainfall | Optimal Crop suitability tag |
| **Yield Prediction** | `RandomForestRegressor` | Crop Type, Soil Type, Acreage, Rain, Fertilizer | Estimated total harvest in Kg |
| **Price Forecasting** | `RandomForestRegressor` | Commodity tag, Mandi, Month, Historical average | Expected wholesale price per Qtl (INR) |
| **Leaf Disease Scan** | `Sequential CNN` | $128\times128\times3$ Leaf photo upload | Diagnosis label (Healthy / Blight / Spot) |
| **Smart Selling** | `Decision Engine` | Yield Volume, Spot price, Trend index, storage fee | Sell Now vs Hold comparative profit matrix |

---

## 4. How to Run Locally

For detailed commands, database migrations, and testing parameters, refer to the [Deployment Guide](DEPLOYMENT.md).

### Quickstart (Docker Compose)
Ensure Docker is installed and running on your machine.
Run the command at the root workspace directory:
```bash
docker-compose up --build
```
This builds and initializes four active containers:
*   `agrismart_db` (Postgres, port 5432)
*   `agrismart_redis` (Redis, port 6379)
*   `agrismart_backend` (FastAPI REST API, port 8000)
*   `agrismart_frontend` (React Nginx server, port 80)

---

## 5. API Swagger Documentation
FastAPI automatically compiles details for all routes. Once the backend server is running, navigate to:
*   **Swagger Interactive UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
