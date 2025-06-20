
# Dhan AI Trading Agent (Dhan API Ready)

## Table of Contents

1.  [Overview](#overview)
2.  [Core Features](#core-features)
3.  [Technology Stack](#technology-stack)
    *   [Frontend](#frontend)
    *   [Backend](#backend)
4.  [Prerequisites](#prerequisites)
5.  [Environment Variables Setup](#environment-variables-setup)
    *   [Frontend (Gemini API Key)](#frontend-gemini-api-key)
    *   [Backend (Dhan Credentials & PostgreSQL)](#backend-dhan-credentials--postgresql)
6.  [Setup and Installation](#setup-and-installation)
    *   [Frontend Setup](#frontend-setup)
    *   [Backend Setup](#backend-setup)
    *   [Google Cloud SQL (PostgreSQL) Setup (for Paper Trading Persistence)](#google-cloud-sql-postgresql-setup-for-paper-trading-persistence)
7.  [Running the Application](#running-the-application)
    *   [Starting the Backend Server](#starting-the-backend-server)
    *   [Starting the Frontend Application](#starting-the-frontend-application)
8.  [Trading Modes](#trading-modes)
9.  [Project Structure](#project-structure)
10. [API Integration Details](#api-integration-details)
    *   [Gemini API](#gemini-api)
    *   [Dhan API](#dhan-api)
    *   [PostgreSQL (Cloud SQL)](#postgresql-cloud-sql)
11. [Backend Server (`server.js`) Explained](#backend-server-serverjs-explained)
12. [Key Functionality Notes](#key-functionality-notes)
13. [Disclaimer](#disclaimer)
14. [Future Enhancements (Potential)](#future-enhancements-potential)
15. [Cloud Run Deployment Notes](#cloud-run-deployment-notes)

## Overview

The Dhan AI Trading Agent is a sophisticated web application designed to assist users in making informed swing trading decisions for Indian stocks listed on the NSE/BSE. It leverages Google's Gemini API for advanced data analysis and strategy generation. The application is architected with a React frontend and a Node.js/Express backend, which integrates with the Dhan HQ trading API.

The application supports two primary modes:
*   **Paper Trading:** Allows users to simulate trading strategies with virtual money and a customizable budget. **Paper trading data (settings, holdings, ledger, trade history) is persisted using Google Cloud SQL (PostgreSQL) via the backend.**
*   **Live Trading (Real Money):** Enables interaction with the user's actual Dhan account for real-time data and trade execution, using real capital. This mode requires the backend to be correctly configured with valid Dhan API credentials.

Key aspects:
*   Uses `public/NseTotalMarketStockDetails.json` for stock search suggestions and initial data.
*   Relies on backend calls to the Dhan API for detailed instrument information, live portfolio data (holdings, positions, fund limits, order book), and order management when in "Live Trading" mode.
*   Uses the Gemini API to provide market sentiment, key observations, and actionable swing trading strategies.
*   Features a user interface to search for stocks, view dashboards, manage paper/live portfolios, and place orders.
*   The backend is set up to proxy requests to the Dhan API. **Crucially, for "Live Trading (Real Money)" mode to function as intended, the backend server must have valid `DHAN_ACCESS_TOKEN` and `DHAN_CLIENT_ID` environment variables set.**
*   **Paper trading data persistence is achieved by integrating the backend with Google Cloud SQL (PostgreSQL).** This requires setting up a Cloud SQL instance and configuring appropriate environment variables on the backend.
*   The backend is prepared for deployment on Google Cloud Run.

## Core Features

*   **Dual Trading Modes:**
    *   **Paper Trading:** Simulate trades with virtual funds. Data is persisted in your configured Google Cloud SQL (PostgreSQL) database.
    *   **Live Trading (Real Money):** Interact with your Dhan account for real trades. Includes confirmation dialogs for order placement.
*   **Stock Search:** Search for Indian stock symbols.
*   **Comprehensive Stock Dashboard:** Displays current price, change, day's range, volume, along with:
    *   **Price Chart:** Interactive historical price chart.
    *   **Fundamental Analysis:** Key metrics.
    *   **Technical Indicators:** SMA, RSI, MACD.
*   **AI-Powered Insights (via Gemini API):**
    *   **Market Sentiment & Key Observations.**
    *   **Swing Trading Strategies.**
    *   **Trade Decision Panel:** AI suggests BUY, SELL, or HOLD.
*   **Portfolio Interaction (Mode-Dependent):**
    *   **Active Holdings Panel:** View live holdings or paper holdings from PostgreSQL.
    *   **OpenPositions Panel:** View live positions. Live mode allows position conversion.
    *   **Order History Panel:** Track live orders or paper trade history from PostgreSQL.
    *   **Fund Limits Panel:** View live Dhan fund limits or paper account balance from PostgreSQL.
    *   **Paper Ledger Panel:** View a detailed transaction ledger for paper trading, persisted in PostgreSQL.
*   **Dhan API Integrated Backend:**
    *   Node.js/Express backend proxies requests to Dhan API.
    *   **Essential for Live Trading:** Requires `DHAN_ACCESS_TOKEN` and `DHAN_CLIENT_ID`.
*   **Google Cloud SQL (PostgreSQL) Integration for Paper Trading:**
    *   Backend uses a PostgreSQL database to store and retrieve paper trading settings, holdings, ledger, and history.
*   **Automated Trading Engine:**
    *   Can run in either Paper or Live mode.
    *   Scans stocks, gets AI decisions, and can automatically place BUY orders (with confirmation in Live mode for regular orders, or direct placement for Super Orders if configured).
    *   Paper mode auto-trades are persisted to PostgreSQL.
    *   **Live Mode Caution:** The engine will place REAL orders if run in Live Trading mode with valid backend credentials.
*   **Historical Data Fetcher:** Panel to fetch and display detailed historical daily/intraday data via Dhan API.
*   **Super Order Management (Live Mode):** Place, view, modify, and cancel Super Orders (Bracket/Cover Orders as per Dhan).

## Technology Stack

### Frontend
*   **React 19**
*   **TypeScript**
*   **Tailwind CSS**
*   **Recharts**
*   **@google/genai (Gemini API SDK)**
*   **ES Modules**

### Backend
*   **Node.js**
*   **Express.js**
*   **`node-fetch@2`**
*   **`pg` (node-postgres):** PostgreSQL client for Node.js.
*   **`cors`**
*   **`dotenv`**

## Prerequisites

*   **Node.js and npm** (LTS versions recommended)
*   **Web Browser** (Modern, e.g., Chrome, Firefox, Edge)
*   **Google Cloud SDK (`gcloud`):** Optional, but recommended for Cloud Run deployment and Cloud SQL Proxy usage.
*   **Dhan HQ Account & API Access:** Required for "Live Trading (RealMoney)" mode functionality. Obtain an Access Token and Client ID from Dhan.
*   **Google Gemini API Key:** Required for all AI-driven analysis features.
*   **Google Cloud Project and Google Cloud SQL (PostgreSQL) Instance:** Required for paper trading data persistence. See [Google Cloud SQL Setup](#google-cloud-sql-postgresql-setup-for-paper-trading-persistence).

## Environment Variables Setup

Create a `.env` file in the `backend/` directory or set these variables in your deployment environment.

### Frontend (Gemini API Key)
The Gemini API key **must** be set as `API_KEY` and accessible to `process.env.API_KEY` in the environment where the frontend application is effectively running (e.g., if hosted on a platform that injects environment variables, or if built with a tool that bundles them).

### Backend (Dhan Credentials & PostgreSQL)
The backend server (`backend/server.js`) requires the following environment variables:

*   **For Dhan API (Live Trading):**
    *   `DHAN_ACCESS_TOKEN`: Your Dhan API Access Token.
    *   `DHAN_CLIENT_ID`: Your Dhan Client ID.
*   **For PostgreSQL (Paper Trading Persistence):**
    *   `DB_USER`: Your PostgreSQL database user (e.g., `postgres` or a custom user).
    *   `DB_PASSWORD`: Password for the PostgreSQL user.
    *   `DB_NAME`: Name of your PostgreSQL database (e.g., `dhan_ai_paper_trading`).
    *   `DB_HOST`: IP address or hostname of your PostgreSQL instance.
        *   If using Cloud SQL Proxy locally forwarding to TCP: `127.0.0.1` or `localhost`.
        *   If connecting directly to Cloud SQL instance: its public or private IP.
        *   If using Cloud SQL Proxy via Unix sockets (e.g., on Cloud Run with integrated connector): The socket path directory, e.g., `/cloudsql`. The `pg` library can use this if `host` is set to this directory and `DB_INSTANCE_CONNECTION_NAME` is also set.
    *   `DB_PORT`: Port PostgreSQL is running on (default `5432`, or your Cloud SQL Proxy port if using TCP).
    *   `DB_INSTANCE_CONNECTION_NAME` (Often needed for Cloud SQL Proxy, especially with Unix Sockets): The full connection name of your Cloud SQL instance (e.g., `your-project-id:your-region:your-instance-name`).
*   **Port for Backend Server:**
    *   `PORT`: Optional, defaults to `3001` if not set.

**Example `.env` file for `backend/` directory:**
```env
# Dhan API Credentials
DHAN_ACCESS_TOKEN="YOUR_DHAN_API_ACCESS_TOKEN"
DHAN_CLIENT_ID="YOUR_DHAN_CLIENT_ID"

# PostgreSQL Database Connection Details
DB_USER="your_db_user"
DB_PASSWORD="your_db_password"
DB_NAME="your_database_name"
DB_HOST="localhost" # Or your Cloud SQL IP, or /cloudsql for Unix sockets
DB_PORT="5432"
# DB_INSTANCE_CONNECTION_NAME="your-project:your-region:your-instance" # Uncomment if using Cloud SQL Proxy with Unix Sockets or if your setup requires it

# Optional Server Port
# PORT=3001
```

**Token Validity:** Dhan Access Tokens can expire. You may need to refresh it periodically.

## Setup and Installation

1.  Clone the repository: `git clone <repository-url>`
2.  Navigate to the project root: `cd dhan-ai-trading-agent`
3.  Ensure `public/NseTotalMarketStockDetails.json` is present in the `public` directory at the project root.

### Frontend Setup
The frontend is designed to be served statically. No separate build step is currently configured in this project structure. Ensure your HTTP server can serve `index.html` and other assets from the root and `public` directory.

### Backend Setup
1.  Navigate to the `backend` directory: `cd backend`
2.  Install dependencies: `npm install` (this will install `express`, `cors`, `dotenv`, `node-fetch@2`, and `pg`).

### Google Cloud SQL (PostgreSQL) Setup (for Paper Trading Persistence)

1.  **Create a Cloud SQL for PostgreSQL Instance:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Navigate to "SQL" and create a new PostgreSQL instance. Choose a region, machine type, and PostgreSQL version (e.g., 13, 14, 15).
    *   Set a strong password for the default `postgres` user or create a new dedicated user for the application.
    *   Create a database within the instance (e.g., `dhan_ai_paper_trading`). Note the **Instance connection name**.
2.  **Connect to your Instance & Create Tables:**
    *   You can connect using `psql` via the Cloud SQL Proxy, or by authorizing your IP and connecting directly (ensure SSL is configured if connecting over public internet).
    *   Run the following SQL DDL statements to create the required tables in your database:
        ```sql
        CREATE TABLE IF NOT EXISTS PaperSettings (
            key VARCHAR(255) PRIMARY KEY,
            value_text TEXT,
            value_numeric NUMERIC,
            value_boolean BOOLEAN,
            last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS PaperHoldings (
            holding_id SERIAL PRIMARY KEY,
            security_id VARCHAR(255) NOT NULL,
            symbol VARCHAR(255) NOT NULL,
            exchange VARCHAR(50) NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 0),
            avg_price NUMERIC(12, 2) NOT NULL,
            ltp NUMERIC(12, 2),
            isin VARCHAR(255),
            dhan_client_id VARCHAR(255) DEFAULT 'PAPER_CLIENT',
            last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (security_id, exchange)
        );

        CREATE TABLE IF NOT EXISTS PaperLedger (
            ledger_id VARCHAR(255) PRIMARY KEY,
            timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            description TEXT NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT', 'INFO')),
            amount NUMERIC(15, 2) NOT NULL,
            balance_after_txn NUMERIC(15, 2) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS PaperTradeHistory (
            order_id VARCHAR(255) PRIMARY KEY,
            trading_symbol VARCHAR(255) NOT NULL,
            transaction_type VARCHAR(10) NOT NULL,
            quantity INTEGER NOT NULL,
            avg_traded_price NUMERIC(12, 2) NOT NULL,
            order_status VARCHAR(50) NOT NULL,
            created_time TIMESTAMP WITH TIME ZONE NOT NULL,
            security_id VARCHAR(255) NOT NULL,
            exchange_segment VARCHAR(50),
            product_type VARCHAR(50),
            order_type VARCHAR(50),
            correlation_id VARCHAR(255),
            dhan_client_id VARCHAR(255),
            filled_qty INTEGER,
            price NUMERIC(12, 2),
            trigger_price NUMERIC(12, 2),
            validity VARCHAR(10),
            oms_error_description TEXT,
            last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ```
3.  **Configure Connectivity for your Backend:**
    *   **Cloud SQL Auth Proxy (Recommended for local development & some deployments):**
        *   [Download and install the proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy).
        *   Run the proxy: `cloud_sql_proxy -instances=YOUR_INSTANCE_CONNECTION_NAME=tcp:0.0.0.0:5432` (replace `YOUR_INSTANCE_CONNECTION_NAME` and optionally the port `5432`).
        *   Your backend will then connect to `localhost:5432` (or the port you specified). Set `DB_HOST="localhost"` and `DB_PORT` accordingly.
    *   **Direct IP (Ensure Security):**
        *   Assign a public IP to your Cloud SQL instance (if not already assigned) and configure its "Authorized networks" under the "Connections" tab to include your backend's egress IP(s). Use SSL connections for security.
    *   **Cloud Run Integrated Connector (Recommended for Cloud Run deployments):**
        *   When deploying to Cloud Run, configure a Cloud SQL connection directly in the Cloud Run service settings. This allows secure connection via Unix sockets. `DB_HOST` would be set to the socket directory (e.g., `/cloudsql`), and `DB_INSTANCE_CONNECTION_NAME` must also be set.
4.  **Set Environment Variables:** Configure `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`, and `DB_INSTANCE_CONNECTION_NAME` for your backend as described in the "Environment Variables Setup" section.

## Running the Application

### Starting the Backend Server
1.  Navigate to the `backend` directory.
2.  **Ensure all required environment variables (Dhan & PostgreSQL) are set (e.g., in `backend/.env` or exported in your shell).**
3.  Start the server: `npm start`
    The backend typically starts on `http://localhost:3001` (or the port specified by the `PORT` env var).

### Starting the Frontend Application
1.  Serve `index.html` from the project root directory using a simple HTTP server. For example, using `npx serve`:
    ```bash
    npx serve .
    ```
    This will typically serve the application on `http://localhost:3000`.
2.  **Backend URL Configuration:** Ensure the `BACKEND_API_URL` constant in `src/constants.ts` points to your running backend server (e.g., `http://localhost:3001/api` for local development, or your deployed Cloud Run URL).

## Trading Modes
*   **Paper Trading:** Allows safe simulation of trading strategies. Data is persisted to your PostgreSQL database.
*   **Live Trading (Real Money):** Interacts with your actual Dhan account. Requires valid Dhan API credentials configured on the backend. Exercise extreme caution.

## Project Structure
```
dhan-ai-trading-agent/
├── backend/
│   ├── server.js           # Express backend server, Dhan API proxy, PostgreSQL integration
│   ├── package.json
│   └── .env                # (Example, not committed) Backend environment variables
├── public/
│   └── NseTotalMarketStockDetails.json # Static stock list for search
├── src/
│   ├── components/         # React components
│   │   ├── shared/         # Reusable UI components
│   │   └── ...             # Feature-specific components
│   ├── services/           # API interaction logic
│   │   ├── geminiService.ts  # Gemini API calls
│   │   ├── dhanBrokerService.ts # Calls to backend (which proxies to Dhan)
│   │   └── paperTradingService.ts # Calls to backend for paper trading data
│   ├── utils/              # Utility functions (e.g., technical indicators)
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # React entry point
│   ├── constants.ts        # Application-wide constants
│   └── types.ts            # TypeScript type definitions
├── index.html              # Main HTML file
├── metadata.json           # Application metadata
└── README.md               # This file
```

## API Integration Details

### Gemini API
*   Used by the frontend (`src/services/geminiService.ts`) for AI-driven stock analysis, strategy generation, and trade decisions.
*   Requires `API_KEY` (Gemini API Key) to be available as `process.env.API_KEY` in the execution context of the frontend.

### Dhan API
*   All interactions with the Dhan API are proxied through the backend server (`backend/server.js`).
*   The backend requires `DHAN_ACCESS_TOKEN` and `DHAN_CLIENT_ID` environment variables for authentication with the Dhan API.
*   The frontend (`src/services/dhanBrokerService.ts`) makes calls to the backend endpoints, which then relay these requests to the appropriate Dhan API endpoints.

### PostgreSQL (Cloud SQL)
*   Used by the backend (`backend/server.js`) to persist all paper trading data, including settings, current balance, holdings, transaction ledger, and trade history.
*   The backend connects to the PostgreSQL database using the `pg` (node-postgres) library and credentials/connection details provided via environment variables (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`).
*   All CRUD (Create, Read, Update, Delete) operations for paper trading data are handled via SQL queries executed by the backend.

## Backend Server (`server.js`) Explained

The `backend/server.js` file is the core of the backend application. Here's a breakdown of its key sections and functionalities:

1.  **Environment Setup & Module Imports:**
    *   `require('dotenv').config();`: Loads environment variables from a `.env` file into `process.env`.
    *   Imports necessary modules: `express` for the web server, `cors` for enabling Cross-Origin Resource Sharing, `node-fetch@2` for making HTTP requests to the Dhan API, and `pg` (specifically `Pool`) for interacting with the PostgreSQL database.

2.  **Express App Initialization & Port Configuration:**
    *   `const app = express();`: Creates an instance of the Express application.
    *   `const PORT = process.env.PORT || 3001;`: Sets the port for the server, defaulting to 3001.

3.  **Dhan API Configuration:**
    *   `DHAN_API_BASE_URL`: Defines the base URL for Dhan API endpoints.
    *   `DHAN_ACCESS_TOKEN`, `DHAN_CLIENT_ID`: Fetches Dhan credentials from environment variables. Critical for live trading.
    *   A startup validation checks if these Dhan credentials are set.

4.  **PostgreSQL Database Configuration:**
    *   `const dbPool = new Pool({...});`: Initializes a connection pool for PostgreSQL using environment variables (`DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`). This pool manages database connections efficiently.
    *   `postgresDbInitialized`: A boolean flag to track if the connection to PostgreSQL was successful.
    *   `currentPaperSettingsStub`: An in-memory object that holds default paper trading settings. It acts as a fallback if the database connection fails or if settings haven't been loaded from the DB yet. It's updated with DB data upon successful connection.

5.  **Helper Functions:**
    *   `formatTimestampToIST(timestamp)`: A utility function to format JavaScript timestamps into a readable "YYYY-MM-DD HH:MM:SS AM/PM" IST string, used for logging and potentially for storing in the database if specific string formats are needed (though `TIMESTAMP WITH TIME ZONE` in PG handles timezones well).
    *   `initializePostgresDb()`:
        *   An asynchronous function called on server startup.
        *   Attempts to connect to the PostgreSQL database using `dbPool.connect()`.
        *   On successful connection, it sets `postgresDbInitialized` to `true` and updates `currentPaperSettingsStub.persistenceEnabled` and `currentPaperSettingsStub.persistenceStatus`.
        *   It then tries to load existing paper trading settings (like budget, balance, session status) from the `PaperSettings` table to synchronize the in-memory stub. If the table is empty, it may insert default settings.
        *   Handles connection errors gracefully, logging them and keeping `postgresDbInitialized` as `false`.
    *   `makeDhanApiRequest(endpointPath, method, body, additionalHeaders)`:
        *   An asynchronous wrapper around `node-fetch` to make authenticated requests to the Dhan API.
        *   Constructs the full URL, adds the `access-token` and other necessary headers.
        *   Handles request body for POST/PUT requests.
        *   Includes logging for requests and robust error handling for Dhan API responses (parsing JSON errors, status codes).
        *   Throws a custom error if Dhan credentials are not set.
    *   `queryDb(sql, params)`:
        *   An asynchronous helper to execute SQL queries against the PostgreSQL database using the `dbPool`.
        *   It acquires a client from the pool, executes the query, and releases the client.
        *   Throws an error if the database is not initialized.

6.  **Express Middleware:**
    *   `app.use(cors());`: Enables CORS for all routes, allowing the frontend (potentially on a different origin) to make requests.
    *   `app.use(express.json());`: Parses incoming requests with JSON payloads (e.g., for POST/PUT requests).

7.  **API Routes - Live Dhan Trading & General:**
    *   `/`: A simple health check route.
    *   `/api`: General API health check.
    *   Routes like `/api/instruments/search`, `/api/portfolio/holdings`, `/api/orders/place`, `/api/super/orders`, etc., are proxies. They receive requests from the frontend, call the `makeDhanApiRequest` helper to forward the request to the actual Dhan API, and then send the Dhan API's response back to the frontend.
    *   These routes handle request validation (e.g., checking for required parameters) and map frontend requests to the appropriate Dhan API calls.

8.  **API Routes - Paper Trading (`/api/paper-trading/*`) with PostgreSQL Integration:**
    These endpoints manage simulated trading data stored in the PostgreSQL database.
    *   **`/api/paper-trading/data` (GET):**
        *   Retrieves all current paper trading data.
        *   SQL: `SELECT * FROM PaperSettings` to get current budget, balance, session status.
        *   SQL: `SELECT * FROM PaperHoldings` to get all simulated stock holdings.
        *   SQL: `SELECT * FROM PaperLedger ORDER BY timestamp DESC` to get transaction history.
        *   SQL: `SELECT * FROM PaperTradeHistory ORDER BY created_time DESC` to get simulated order history.
        *   If `postgresDbInitialized` is false, it returns data from the in-memory `currentPaperSettingsStub` and empty arrays for holdings, ledger, and history.
        *   Data fetched from DB is used to update `currentPaperSettingsStub` to keep it in sync.
    *   **`/api/paper-trading/session` (POST):**
        *   Manages starting or resetting a paper trading session. Accepts `initialBudget` and `mode` (`reset` or `redefine`).
        *   Uses a PostgreSQL transaction (`BEGIN`, `COMMIT`, `ROLLBACK`) for atomicity.
        *   **`reset` mode:**
            *   SQL: `DELETE FROM PaperHoldings`, `DELETE FROM PaperLedger`, `DELETE FROM PaperTradeHistory` to clear previous session data.
            *   SQL: `INSERT INTO PaperSettings` (or `UPDATE ON CONFLICT`) to set the new `initialBudget`, `currentBalance` (equal to initialBudget), and `sessionActive` to `true`.
            *   SQL: `INSERT INTO PaperLedger` to log the session start and initial budget.
        *   **`redefine` mode:**
            *   Calculates budget adjustment. Updates `currentBalance` based on this adjustment.
            *   SQL: `UPDATE PaperSettings` for `initialBudget` and `currentBalance`.
            *   SQL: `INSERT INTO PaperLedger` to log the budget adjustment (credit or debit).
        *   If `postgresDbInitialized` is false, it simulates these changes in memory using `currentPaperSettingsStub`.
    *   **`/api/paper-trading/trade` (POST):**
        *   Simulates a trade (buy or sell). Accepts `orderRequest` and `currentStockPriceForFill`.
        *   Uses a PostgreSQL transaction.
        *   First, fetches the current balance from `PaperSettings` (or uses `currentPaperSettingsStub.currentBalance` if DB read fails).
        *   **Validation:** Checks for sufficient funds if it's a BUY order. If insufficient, a rejected order is logged to `PaperTradeHistory`.
        *   **If trade proceeds:**
            *   Constructs an `executedOrder` object (simulating a successful trade or a specific paper status).
            *   SQL: `UPDATE PaperSettings` to deduct/add trade value from/to `currentBalance`.
            *   SQL: `INSERT INTO PaperLedger` to record the transaction (debit for buy, credit for sell).
            *   SQL: `INSERT INTO PaperTradeHistory` to log the executed paper order details.
            *   **Holdings Update:**
                *   SQL: `SELECT quantity, avg_price FROM PaperHoldings WHERE security_id = ...` to check existing holding.
                *   If BUY:
                    *   If holding exists: SQL `UPDATE PaperHoldings` to increase quantity and recalculate `avg_price`.
                    *   If not: SQL `INSERT INTO PaperHoldings` with new stock.
                *   If SELL:
                    *   If holding exists: SQL `UPDATE PaperHoldings` to decrease quantity. If quantity becomes zero, SQL `DELETE FROM PaperHoldings`.
                    *   If selling stock not in holdings (for short selling simulation if supported, or error otherwise), appropriate logic/warning.
        *   If `postgresDbInitialized` is false, it simulates these changes in memory.
        *   The response includes the `executedOrder`, `updatedSettings`, `updatedHoldings` (fetched from DB after transaction), and the `newLedgerEntry`.

9.  **Server Startup:**
    *   `app.listen(PORT, '0.0.0.0', () => {...});`: Starts the Express server, listening on the configured port and all available network interfaces (due to `0.0.0.0`).
    *   Logs the server URL, status of Dhan credentials, and PostgreSQL connection status to the console.

This detailed structure allows the backend to serve as a robust intermediary for live Dhan API operations and as a persistent data store for paper trading simulations using PostgreSQL.

## Key Functionality Notes
*   **Dhan API Interaction:** All live trading interactions are securely routed through the backend server.
*   **Live Trading Confirmation:** The frontend includes confirmation dialogs before placing live trades to prevent accidental orders.
*   **Paper Trading Persistence:** Paper trading data (settings, balance, holdings, ledger, history) is stored and managed in your configured PostgreSQL database via the backend. The in-memory stub acts as a temporary fallback.
*   **Error Handling**: Basic error display is present in the frontend. Backend logs errors and returns appropriate HTTP status codes and JSON error messages.

## Disclaimer
Trading in financial markets involves substantial risk of loss and is not suitable for every investor. The information and AI-generated suggestions provided by this application are for informational and educational purposes only and do not constitute financial advice, investment advice, trading advice, or any other sort of advice. You should not make any decision, financial, investment, trading or otherwise, based on any of the information presented in this application without undertaking independent due diligence and consultation with a professional broker or financial advisory. You understand that you are using any and all information available on or through this application AT YOUR OWN RISK.

## Future Enhancements (Potential)
*   User authentication and multi-user support.
*   More sophisticated AI models and strategy backtesting.
*   Advanced charting and technical analysis tools.
*   Real-time WebSocket integration for live price feeds.
*   More detailed error handling and user feedback.
*   Support for other asset classes or exchanges via Dhan.
*   Option chain analysis and trading.

## Cloud Run Deployment Notes
To deploy the backend to Google Cloud Run:
1.  Ensure Google Cloud SDK is installed and authenticated (`gcloud auth login`, `gcloud config set project YOUR_PROJECT_ID`).
2.  Enable Cloud Run and Cloud Build APIs in your Google Cloud project.
3.  **Cloud SQL Connection for Cloud Run:**
    *   **Recommended Method:** Use the **Cloud SQL connection** feature when configuring your Cloud Run service (under the "Connections" tab during service creation/update). Select your PostgreSQL instance. This sets up a secure connection via Unix sockets.
    *   When using this method, your `DB_HOST` environment variable in Cloud Run should be set to the directory `/cloudsql` and `DB_INSTANCE_CONNECTION_NAME` to your instance's connection name (e.g., `your-project:your-region:your-instance`). The `pg` library can use this socket path. `DB_PORT` may not be needed if using Unix sockets.
4.  **Secrets Management for Sensitive Data:**
    *   Store `DHAN_ACCESS_TOKEN`, `DHAN_CLIENT_ID`, and `DB_PASSWORD` securely using Google Secret Manager.
    *   Grant your Cloud Run service's runtime service account permission to access these secrets (Secret Manager Secret Accessor role).
5.  **Build and Deploy using `gcloud run deploy`:**
    Place your `Dockerfile` (if any, or let Cloud Build infer) in the `backend/` directory.
    From the project root (or `backend/` directory if source is specified accordingly):
    ```bash
    gcloud run deploy dhan-ai-trading-agent-backend \
        --source backend/  # Specifies the directory containing backend code and Dockerfile (if any)
        --platform managed \
        --region YOUR_CLOUD_RUN_REGION \
        --allow-unauthenticated \ # Or configure IAM for authentication
        --update-secrets=DHAN_ACCESS_TOKEN=YOUR_DHAN_TOKEN_SECRET_NAME:latest \
        --update-secrets=DHAN_CLIENT_ID=YOUR_DHAN_CLIENT_ID_SECRET_NAME:latest \
        --update-secrets=DB_PASSWORD=YOUR_DB_PASSWORD_SECRET_NAME:latest \
        --set-env-vars DB_USER="your_db_user" \
        --set-env-vars DB_NAME="your_db_name" \
        --set-env-vars DB_HOST="/cloudsql" \ # For Unix socket connection
        --set-env-vars DB_INSTANCE_CONNECTION_NAME="your-project:your-region:your-instance" \
        --add-cloudsql-instances YOUR_INSTANCE_CONNECTION_NAME
        # Replace YOUR_..._SECRET_NAME with your Secret Manager secret names.
        # Ensure YOUR_INSTANCE_CONNECTION_NAME matches your Cloud SQL instance.
    ```
    *   Adjust `--set-env-vars` for `DB_HOST` and potentially `DB_PORT` if you are using TCP connections via the Cloud SQL Proxy sidecar (less common now with integrated connections).
6.  After deployment, update `BACKEND_API_URL` in the frontend's `src/constants.ts` to the URL provided by Cloud Run.
```