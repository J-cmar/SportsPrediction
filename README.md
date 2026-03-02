# Hedge Your Bets - Sports Betting Analysis Platform

**Hedge Your Bets** is a full-stack web application for analyzing NFL player prop bets. Users can input betting scenarios and receive predictions with confidence intervals, win probabilities, and expected value calculations to make informed betting decisions.

**Live Demo**: Visit the deployed application (http://hedgeyourbets.duckdns.org/) _(Recommended for testing)_

## 🏈 Project Overview

This application provides a comprehensive platform for analyzing NFL betting scenarios with the following features:

- **User Authentication**: Secure GitHub OAuth with optional DynamoDB session persistence
- **Betting Analysis**: Input player props (over/under) and receive detailed predictions
- **Betting History**: Track your betting scenarios with persistent storage in DynamoDB
- **Popular Bets**: View trending bets from the community
- **Real-time Data**: Access to 8,120+ NFL players across QB, RB, WR, and TE positions
- **Automated Predictions**: Backend uses trained quantile regression models to analyze player performance with confidence intervals

### Supported Bet Types

- **QB**: Passing Yards, Passing TDs, Completions, Passing Interceptions, Rushing Yards
- **RB**: Rushing Yards, Rushing TDs, Receptions, Receiving Yards, Receiving TDs
- **WR**: Receptions, Receiving Yards, Receiving TDs, Targets
- **TE**: Receptions, Receiving Yards, Receiving TDs

---

## ⚡ Quickstart

### ⭐ Use the Deployed Application (Recommended)

**We strongly recommend using the [live deployed application](http://hedgeyourbets.duckdns.org/) for testing and evaluation.**

The deployed version provides:

- ✅ **Full functionality** - All features including DynamoDB persistence, betting history, and popular bets
- ✅ **Pre-loaded data** - 8,120+ NFL players with historical statistics (2024-2025 seasons)
- ✅ **Complete authentication** - GitHub OAuth with persistent sessions across devices
- ✅ **No setup required** - Start using immediately without installing dependencies or configuring environment variables
- ✅ **Production environment** - Deployed on AWS EC2 with automated CI/CD pipeline

**👉 [Visit the deployed app now](http://hedgeyourbets.duckdns.org/)**

---

### Local Development Setup (Optional)

**Note**: Local setup requires significant configuration (OAuth apps, environment variables, data loading) and runs with limited functionality (JWT-only sessions, no DynamoDB persistence).

If you prefer to run the application locally, follow these steps:

#### Prerequisites

- **Node.js** (v16+)
- **Python** (v3.8+)
- **npm** and **pip**

#### Backend Setup (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
# Activate: venv\Scripts\activate (Windows) or source venv/bin/activate (Mac/Linux)

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Load NFL player data (8,120 players for 2024-2025)
python manage.py load_player_data --years 2024 2025

# Start Django server
python manage.py runserver
# Server runs at http://127.0.0.1:8000
```

#### OAuth & Environment Variables Setup

Before running the frontend, you need to set up GitHub OAuth and configure environment variables:

1. **Create GitHub OAuth App**:
    - Go to [GitHub Developer Settings](https://github.com/settings/developers)
    - Click "New OAuth App"
    - Fill in the details:
        - **Application name**: Hedge Your Bets (or any name)
        - **Homepage URL**: `http://localhost:3000`
        - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
    - Click "Register application"
    - Copy the **Client ID** and generate a **Client Secret**

2. **Configure Environment Variables**:

    ```bash
    cd frontend

    # Copy the sample environment file
    cp .env.local.SAMPLE .env.local

    # Edit .env.local with your favorite text editor
    # Fill in the following REQUIRED variables:
    ```

3. **Required Variables** in `.env.local`:
    - `AUTH_GITHUB_ID`: Your GitHub OAuth App Client ID
    - `AUTH_GITHUB_SECRET`: Your GitHub OAuth App Client Secret
    - `AUTH_SECRET`: Generate with `npx auth secret` or `openssl rand -base64 32`
    - `NEXTAUTH_URL`: Set to `http://localhost:3000` for local development

4. **Optional Variables** (for production with DynamoDB):
    - `AUTH_DYNAMODB_ID`: AWS Access Key ID
    - `AUTH_DYNAMODB_SECRET`: AWS Secret Access Key
    - `AUTH_DYNAMODB_REGION`: AWS Region (e.g., `us-east-1`)

See [`frontend/.env.local.SAMPLE`](frontend/.env.local.SAMPLE) for detailed configuration with comments.

#### Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs at http://localhost:3000
```

#### Authentication Setup (Optional DynamoDB)

The application supports two authentication modes:

1. **Without DynamoDB (Default for Local Development)**:
    - NextAuth automatically uses **JWT-based sessions** with no database persistence
    - Sessions are stateless and stored in encrypted cookies
    - **No AWS setup required** - authentication works out of the box
    - **Limitation**: Session data is not persisted across device/browser changes
    - Ideal for local development and testing

2. **With DynamoDB (Production Deployment)**:
    - Enables **persistent sessions** across devices and browsers
    - Uses AWS DynamoDB with **single-table design**:
        - **`users` table**: Stores user accounts, sessions, and verification tokens using a single-table pattern with GSI1 (session lookups) and GSI2 (token lookups)
        - **`PreviousBets` table**: Stores betting history with UserId (PK) and createdAt (SK) for efficient user-specific queries
    - Requires AWS credentials in `.env.local`:
        ```bash
        AWS_ACCESS_KEY_ID=your_key
        AWS_SECRET_ACCESS_KEY=your_secret
        AWS_REGION=us-east-1
        ```
    - The application automatically detects DynamoDB configuration in `frontend/auth.ts` - if credentials are absent, it falls back to JWT

**For evaluation purposes, we recommend using the deployed application** which includes full DynamoDB persistence and authentication.

---

## 🏗️ Architecture & Design Decisions

### Technology Stack

**Frontend**: Next.js 14 (React) with App Router, TypeScript, Tailwind CSS  
**Backend**: Django 5.0 REST Framework with SQLite (local)  
**Authentication**: NextAuth.js with GitHub OAuth, optional DynamoDB adapter  
**Database**: AWS DynamoDB (users & betting history), Django SQLite (NFL player data)  
**Predictions**: LightGBM quantile regression models (56 models: 4 positions × 4-5 stats × 3 quantiles)  
**Infrastructure**: Nginx (reverse proxy), PM2 (process manager), AWS EC2 (Ubuntu t3.medium)

### Deployment Architecture

The application is deployed on **AWS EC2 (Ubuntu t3.medium)** using **PM2** as the process manager:

- **Frontend**: Next.js production build served by PM2 on port `3000`
    - Static assets (HTML, JS, CSS) compiled with `npm run build`
    - PM2 ensures automatic restarts and process monitoring
- **Backend**: Django REST API served by PM2 on port `8000`
    - REST API endpoints for teams, players, and predictions
    - Connects to SQLite database containing 8,120 NFL players (2024-2025 seasons)
    - Prediction models loaded on-demand using lazy loading pattern

- **Reverse Proxy**: Nginx handles incoming HTTP traffic and routing
    - Port forwarding from port `80` (HTTP) to port `3000` (Next.js application)
    - **Smart Routing**: Differentiates between Next.js API routes and Django backend calls:
        - Next.js API routes (`/api/popular-bets`, `/api/place-bet`, `/api/get-bets`, `/api/delete-bets`) are handled by the Next.js server on port `3000`
        - Django backend routes (`/api/teams`, `/api/players`, `/api/actions`, `/api/predict-bet`) are proxied to port `8000`
    - Enables standard HTTP port (80) access without requiring `:3000` in URLs
    - Provides a single entry point for the entire application

**Why PM2?** PM2 provides zero-downtime deployments, automatic restart on failure, log management, and process clustering without requiring complex container orchestration.

**Why Nginx?** Nginx acts as a reverse proxy to handle port forwarding and route requests between the Next.js frontend and Django backend APIs. This architecture allows both servers to run independently while presenting a unified interface to users on standard HTTP port 80.

### CI/CD Pipeline

Continuous deployment is automated using **GitHub Actions**:

1. **Trigger**: Push to `main` branch or manual workflow dispatch
2. **Workflow** (`.github/workflows/deploy.yml`):
    - Authenticates to EC2 using SSH key stored in GitHub Secrets
    - Pulls latest code from repository
    - Runs deployment script (`deploy.sh`) which:
        - Installs frontend dependencies and rebuilds Next.js
        - Installs backend dependencies
        - Restarts both PM2 processes (`sportsbet` and `sportsbet-backend`)
3. **Secrets Management**:
    - `EC2_SSH_KEY`: Private key for SSH authentication (stored as GitHub repository secret)
    - `EC2_HOST`: EC2 instance public IP address

**Why GitHub Actions?** Free for public repositories, integrates seamlessly with GitHub, and provides simple SSH-based deployment without requiring AWS CodeDeploy or additional infrastructure.

### Database Design

#### DynamoDB - Single Table Design

The application uses **two DynamoDB tables** with an **IAM user** (`hedge-bets-dynamodb-user`) that has restricted permissions (`AmazonDynamoDBFullAccess` scoped to specific tables):

1. **`users` Table** (Single-Table Design for NextAuth):
    - **PK**: `USER#<userId>`, `SESSION#<sessionToken>`, `ACCOUNT#<providerAccountId>`, or `VERIFICATION_TOKEN#<identifier>`
    - **SK**: Composite key for entity type (e.g., `USER`, `ACCOUNT#<provider>`)
    - **GSI1** (PK: `sessionToken`, SK: `sessionToken`): Fast session lookups
    - **GSI2** (PK: `identifier`, SK: `token`): Verification token lookups
    - **Design Rationale**: Single-table design reduces DynamoDB costs and query complexity by co-locating related entities (users, sessions, accounts) in one table with strategic GSIs for access patterns

2. **`PreviousBets` Table**:
    - **PK**: `UserId` (partition key for user-specific queries)
    - **SK**: `createdAt` (sort key for chronological ordering)
    - **Attributes**: `sport`, `team`, `player`, `action`, `betType`, `actionAmount`, `betAmount`, `prediction`, `timestamp`
    - **Design Rationale**: Efficiently retrieves betting history per user with time-based sorting; enables aggregation queries for popular bets

**IAM Security**: The `hedge-bets-dynamodb-user` follows the principle of least privilege, with access limited to only these two tables, preventing unauthorized access to other AWS resources.

### Authentication Design

**NextAuth.js** with **GitHub OAuth** provides secure authentication:

- **OAuth Provider**: GitHub (Google OAuth removed for simplicity)
- **Session Strategy**:
    - **With DynamoDB**: Persistent sessions stored in `users` table, allowing cross-device authentication
    - **Without DynamoDB**: JWT-based sessions stored in encrypted HTTP-only cookies (stateless, no persistence)
- **Adapter Detection**: `frontend/auth.ts` automatically detects AWS credentials from environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`) and conditionally initializes the DynamoDB adapter
- **Fallback Behavior**: If no DynamoDB config is found, NextAuth falls back to JWT sessions, enabling local development without AWS setup

**Design Rationale**: Optional DynamoDB makes the project beginner-friendly for local setup while maintaining production-grade persistence in deployment. GitHub OAuth provides secure authentication without managing passwords or custom auth flows.

### Prediction Architecture

The application uses **LightGBM quantile regression models** trained on historical NFL data to generate predictions. The pipeline consists of:

1. **Feature Engineering** (`feature_engineering.py`):
    - Computes rolling averages (3-game, 5-game) for player stats
    - Calculates team-level context (team passing yards, rushing yards, receptions, targets)
    - Generates temporal features (season progression, playoff indicators)
    - Aligns features with model requirements

2. **Model Loader** (`model_loader.py`):
    - **Lazy loading**: Models (56 × ~1-5 MB each) are loaded on-demand to minimize memory usage
    - Caches loaded models in memory for subsequent requests
    - Graceful fallback if specific position-stat model is missing

3. **Prediction Service** (`prediction_service.py`):
    - Orchestrates feature preparation, model loading, and inference
    - Returns quantile predictions (q10, q50, q90) for confidence intervals
    - Calculates win probability, expected value, and betting recommendations

**Design Rationale**: Lazy loading prevents loading all 56 models (~100+ MB) on server startup, reducing memory footprint and enabling faster cold starts. Team-level features improve prediction accuracy by incorporating offensive scheme context.

### Project Structure

```
SportsPrediction/
├── .github/workflows/
│   └── deploy.yml              # CI/CD pipeline (GitHub Actions)
├── frontend/                   # Next.js application
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable React components
│   ├── auth.ts                 # NextAuth configuration (optional DynamoDB adapter)
│   └── middleware.ts           # Auth middleware for protected routes
├── backend/                    # Django application
│   ├── api/                    # REST API endpoints
│   │   ├── models.py           # Player, PlayerGameStats, BettingScenario
│   │   ├── views.py            # Teams, players, actions endpoints
│   │   ├── prediction_views.py # Prediction endpoint
│   │   └── data_access.py      # Team stats, player history queries
│   ├── ml_service/             # Prediction service
│   │   ├── prediction_service.py    # Orchestrates predictions
│   │   ├── feature_engineering.py   # Feature preparation
│   │   ├── model_loader.py          # Lazy model loading
│   │   └── *.joblib            # 56 trained quantile regression models
│   └── hedge_bets/             # Django settings
├── machine_learning/           # Model training code
│   ├── datasets/               # Historical NFL data (CSV)
│   └── training_code/          # Jupyter notebooks for model training
└── deploy.sh                   # Deployment script (git pull, npm build, pm2 restart)
```

---

## 📡 API Endpoints

### Backend API (Django)

All endpoints prefixed with `/api/`:

**Data Retrieval**:

- `GET /api/teams/` - List all 32 NFL teams
- `GET /api/players/?team=KC` - Get players by team abbreviation
- `GET /api/actions/?position=QB` - Get available bet types for position (QB, RB, WR, TE)

**Betting History** (DynamoDB):

- `POST /api/place-bet` - Save betting scenario
- `GET /api/get-bets` - Retrieve user's betting history
- `DELETE /api/delete-bets` - Delete user's bets
- `GET /api/popular-bets` - Aggregate most popular sport/team/player bets

**Prediction**:

- `POST /api/predict-bet/` - Analyze betting scenario
    ```json
    {
    	"player": "Patrick Mahomes",
    	"action": "Passing Yards",
    	"bet_type": "over",
    	"action_amount": 275.5,
    	"bet_amount": 100.0
    }
    ```
    Returns: Quantiles (q10, q50, q90), win probability, confidence level, expected value, recommendation

### Frontend API (Next.js)

- `GET /api/popular-bets` - Aggregates PreviousBets from DynamoDB
- `GET /api/place-bet` - Stores bet in DynamoDB
- `GET /api/get-bets` - Fetches user's bets from DynamoDB

---

## 👥 Created By:

### Jason Mar

---

## Special Thanks

Tony Gonzalez: For providing expert guidance on machine learning architecture and data model infrastructure.

---

## 📄 License

This project is licensed under the MIT License.
