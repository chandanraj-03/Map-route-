# 🚀 AI Route Optimization Platform

> An intelligent logistics platform powered by machine learning to optimize delivery routes, predict ETAs, and manage drivers and stores — built with FastAPI, React, MongoDB, and Redis.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running with Docker](#running-with-docker)
  - [Running Locally (Development)](#running-locally-development)
- [API Endpoints](#api-endpoints)
- [ML Models](#ml-models)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🌟 Overview

The **AI Route Optimization Platform** is a full-stack logistics intelligence system designed to streamline last-mile delivery operations. It leverages an ensemble of machine learning models — Random Forest, XGBoost, and LSTM — to predict delivery times, optimize multi-driver routes, and provide actionable analytics for logistics managers.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Route Optimization** | AI-powered multi-driver route planning using Google Maps API |
| ⏱️ **ETA Prediction** | Ensemble ML models (RF + XGBoost + LSTM) for delivery time forecasting |
| 👷 **Driver Management** | Full CRUD for driver profiles, assignments, and performance tracking |
| 🏪 **Store Management** | Manage delivery locations with geofencing support |
| 📊 **Analytics Dashboard** | Real-time delivery insights, performance KPIs, and trend analysis |
| 🔔 **Geofencing** | Automated alerts when drivers enter/exit defined geographic zones |
| 📋 **Audit Logs** | Complete activity trail for compliance and debugging |
| 📅 **Weekly Planner** | Schedule and preview upcoming delivery runs |
| 🔐 **Authentication** | Secure JWT-based user authentication |
| 📈 **Model Monitoring** | Track ML model accuracy and trigger retraining |

---

## 🛠️ Tech Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** — High-performance Python API framework
- **[MongoDB](https://www.mongodb.com/)** (via Motor/PyMongo) — Primary database
- **[Redis](https://redis.io/)** — Caching and background task queuing
- **[Scikit-learn](https://scikit-learn.org/)** — Random Forest model
- **[XGBoost](https://xgboost.readthedocs.io/)** — Gradient boosted trees model
- **[TensorFlow / Keras](https://www.tensorflow.org/)** — LSTM sequential model
- **[Google Maps Platform](https://developers.google.com/maps)** — Distance matrix & geocoding

### Frontend
- **[React 19](https://react.dev/)** — UI library
- **[Vite](https://vitejs.dev/)** — Lightning-fast build tool
- **[React Router DOM v7](https://reactrouter.com/)** — Client-side routing
- **[TailwindCSS v4](https://tailwindcss.com/)** — Utility-first styling
- **[Lucide React](https://lucide.dev/)** — Icon library
- **[@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/)** — Google Maps React integration

### Infrastructure
- **[Docker & Docker Compose](https://docs.docker.com/compose/)** — Containerized local dev
- **[Nginx](https://nginx.org/)** — Frontend reverse proxy

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        React Frontend                       │
│   Dashboard │ Route Planner │ Analytics │ Driver Mgmt │ ... │
└───────────────────────┬────────────────────────────────────┘
                        │ HTTPS / REST API
┌───────────────────────▼────────────────────────────────────┐
│                  FastAPI Backend (Port 8000)                │
│  /auth │ /predict │ /drivers │ /stores │ /analytics │ ...  │
│                                                             │
│  ┌─────────────────┐   ┌───────────────────────────────┐   │
│  │  ML Prediction  │   │       Service Layer            │   │
│  │  RF + XGB + LSTM│   │  Google Maps │ Optimizer │ ... │   │
│  └─────────────────┘   └───────────────────────────────┘   │
└──────────────────────┬──────────────────┬──────────────────┘
                       │                  │
           ┌───────────▼──────┐  ┌────────▼────────┐
           │    MongoDB Atlas  │  │  Redis Cache     │
           │  (Primary Store)  │  │  (Queue/Cache)   │
           └──────────────────┘  └──────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) *(for containerized setup)*
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or local MongoDB instance
- A [Google Maps API Key](https://developers.google.com/maps/get-started) with the following APIs enabled:
  - Maps JavaScript API
  - Distance Matrix API
  - Geocoding API

---

### Environment Variables

Create a `.env` file in the project root:

```env
# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Database
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<appname>

# Redis
REDIS_URL=redis://localhost:6379/0

# Application
ENVIRONMENT=development
API_V1_STR=/api/v1
SECRET_KEY=your_strong_secret_key_here
```

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

---

### Running with Docker

The easiest way to run the full stack locally:

```bash
# Clone the repository
git clone https://github.com/chandanraj-03/Map-route-.git
cd ai_route

# Start all services (backend + frontend + MongoDB + Redis)
docker-compose up --build
```

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost           |
| Backend   | http://localhost:8000      |
| API Docs  | http://localhost:8000/docs |
| MongoDB   | mongodb://localhost:27017  |
| Redis     | redis://localhost:6379     |

---

### Running Locally (Development)

**1. Setup Environment**

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

**2. Start the Application**

You can start both the frontend and backend simultaneously using the provided `launch.py` script:

```bash
python launch.py
```

The frontend will be available at **http://localhost:5173** and will proxy API requests to the backend.

---

## 📡 API Endpoints

The full interactive API documentation is available at `http://localhost:8000/docs` (Swagger UI) once the backend is running.

| Prefix | Tag | Description |
|---|---|---|
| `/auth` | Authentication | User login, registration, token management |
| `/predict` | Prediction | ETA prediction with ensemble ML models |
| `/drivers` | Drivers | Driver CRUD, assignment, performance |
| `/stores` | Stores | Store/delivery location management |
| `/data` | Data | Data ingestion and dataset management |
| `/analytics` | Analytics | Delivery KPIs and trend reporting |
| `/audit` | Audit | Activity log retrieval |
| `/geofence` | Geofence | Zone creation and alert management |
| `/health` | Health | Service health check |
| `/retrain` | ML | Trigger model retraining |

---

## 🤖 ML Models

The prediction engine uses an **ensemble of three models** for robust ETA forecasting:

| Model | File | Description |
|---|---|---|
| **Random Forest** | `backend/ml/rf_model.py` | Baseline ensemble model for tabular features |
| **XGBoost** | `backend/ml/xgb_model.py` | Gradient boosted trees for high-accuracy prediction |
| **LSTM** | `backend/ml/lstm_model.py` | Sequential model capturing temporal delivery patterns |
| **K-Means Clustering** | `backend/ml/cluster_model.py` | Groups delivery zones for smarter driver assignment |
| **Optimizer** | `backend/ml/optimizer.py` | Multi-driver route optimization engine |

**Training:**

```bash
# From the project root, with venv activated
python -m backend.ml.train
```

Model artifacts are saved and loaded via `joblib`. The `/retrain` endpoint triggers background retraining.

---

## 📁 Project Structure

```
ai_route/
├── backend/
│   ├── api/                  # API utility helpers
│   ├── database/             # MongoDB connection & models
│   ├── ml/                   # Machine learning models & training
│   │   ├── rf_model.py
│   │   ├── xgb_model.py
│   │   ├── lstm_model.py
│   │   ├── cluster_model.py
│   │   ├── optimizer.py
│   │   └── train.py
│   ├── routes/               # FastAPI route handlers
│   │   ├── auth.py
│   │   ├── predict.py
│   │   ├── drivers.py
│   │   ├── stores.py
│   │   ├── analytics.py
│   │   ├── geofence.py
│   │   ├── audit.py
│   │   └── data.py
│   ├── services/             # Business logic layer
│   │   ├── prediction_service.py
│   │   ├── google_maps.py
│   │   ├── assignment_engine.py
│   │   └── multi_driver_optimizer.py
│   ├── utils/                # Shared utilities
│   ├── workers/              # Background task workers
│   ├── main.py               # Application entry point
│   └── requirements.txt
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/       # Reusable React components
│       ├── pages/            # Page-level components
│       │   ├── LandingPage.jsx
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── RoutePlanner.jsx
│       │   ├── WeeklyPlanner.jsx
│       │   ├── DriverManagement.jsx
│       │   ├── DriverPerformance.jsx
│       │   ├── StoreManagement.jsx
│       │   ├── Analytics.jsx
│       │   ├── ModelMonitoring.jsx
│       │   └── AuditLogs.jsx
│       ├── App.jsx
│       └── main.jsx
├── data/                     # Sample datasets & data files
├── notebooks/                # Jupyter notebooks for EDA
├── scripts/                  # Utility scripts
├── tests/                    # Test suite
├── docker/                   # Docker configuration files
├── docker-compose.yml
├── .env                      # Environment variables (not committed)
├── .gitignore
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is for academic and educational purposes.

---

<div align="center">
  <strong>Built with ❤️ by Chandan Raj</strong>
</div>
