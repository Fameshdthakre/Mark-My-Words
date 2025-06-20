// --- Environment Variable Setup ---
// Loads environment variables from a .env file into process.env for local development.
// In production (e.g., Cloud Run), these should be set directly in the environment.
require('dotenv').config(); 

// --- Module Imports ---
const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing
const fetch = require('node-fetch'); // Node.js library for making HTTP requests, similar to browser's fetch API
const { Pool } = require('pg'); // PostgreSQL client library for Node.js

// --- Express App Initialization ---
const app = express(); // Creates an instance of the Express application
const PORT = process.env.PORT || 3001; // Defines the port the server will listen on. Uses environment variable PORT or defaults to 3001.

// --- Dhan API Configuration ---
const DHAN_API_BASE_URL = 'https://api.dhan.co'; // Base URL for all Dhan API endpoints
const DHAN_ACCESS_TOKEN = process.env.DHAN_ACCESS_TOKEN; // Dhan Access Token, fetched from environment variables
const DHAN_CLIENT_ID = process.env.DHAN_CLIENT_ID; // Dhan Client ID, fetched from environment variables

// --- Benchmark Index Configuration (Example: NIFTY 50) ---
// Used by the backend, e.g., for fetching market trend data in automated trading.
const BENCHMARK_INDEX_CONFIG_BACKEND = {
  dhanSecurityId: "26000", // Dhan's security ID for NIFTY 50 index
  exchangeSegment: 'IDX_I', // Exchange segment for Index
};

// --- Startup Validation for Dhan Credentials ---
// Checks if Dhan API credentials are set. If not, logs an error as live trading will fail.
// Skips this check in a 'test' environment.
if ((!DHAN_ACCESS_TOKEN || !DHAN_CLIENT_ID) && process.env.NODE_ENV !== 'test') {
  console.error("FATAL ERROR: DHAN_ACCESS_TOKEN or DHAN_CLIENT_ID environment variable not set. Live trading features will not work.");
}

// --- PostgreSQL Database Configuration (for Paper Trading Persistence) ---
// Initializes a connection pool to the PostgreSQL database.
// Connection parameters are read from environment variables.
const dbPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432, // Default PostgreSQL port is 5432
  // Example SSL configuration for production, adjust as needed.
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Example for Cloud SQL Proxy using Unix sockets (host points to the socket directory).
  // host: `/cloudsql/${process.env.DB_INSTANCE_CONNECTION_NAME}` 
});

// Flag to track if the PostgreSQL database connection was successful.
let postgresDbInitialized = false; 

// --- In-memory Stub for Paper Trading Settings (Fallback) ---
// This object holds default paper trading settings and serves as a fallback 
// if the database connection fails or if settings are not yet loaded from the DB.
// It's updated with DB data upon successful connection and operations.
let currentPaperSettingsStub = {
  initialBudget: 100000, // Default initial budget for paper trading
  currentBalance: 100000, // Current available balance for paper trading
  sessionActive: false, // Indicates if a paper trading session is currently active
  persistenceEnabled: false, // True if PostgreSQL DB connection is successful
  persistenceStatus: 'initializing', // Status of persistence: 'initializing', 'db_connected', 'db_connection_failed', etc.
  sheetError: false, // Legacy field, can be mapped to dbError or similar. Represents general persistence issues.
  error: undefined, // Stores any error message related to persistence.
};


// --- Helper Function: Timestamp Formatter ---
/**
 * Formats a JavaScript timestamp into a readable "YYYY-MM-DD HH:MM:SS AM/PM" string in IST.
 * @param {Date|number|string} timestamp - The timestamp to format.
 * @returns {string} The formatted timestamp string.
 */
function formatTimestampToIST(timestamp) {
  const date = new Date(timestamp);
  const options = { // Options for Intl.DateTimeFormat
    timeZone: 'Asia/Kolkata', // Target timezone
    year: 'numeric', month: '2-digit', 
    day: '2-digit', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hour12: true, // Use AM/PM format
  };
  const formatter = new Intl.DateTimeFormat('en-US', options); // Using 'en-US' for predictable part extraction
  const parts = formatter.formatToParts(date); // Get individual date/time parts
  
  // Variables to store extracted parts
  let year, month, day, hour, minute, second, dayPeriod;
  
  // Iterate over parts to assign them to respective variables
  parts.forEach(part => {
    switch (part.type) {
      case 'year': year = part.value; break;
      case 'month': month = part.value; break;
      case 'day': day = part.value; break;
      case 'hour': hour = part.value; break;
      case 'minute': minute = part.value; break;
      case 'second': second = part.value; break;
      case 'dayPeriod': dayPeriod = part.value; break; // AM/PM
    }
  });

  // Construct the desired string format if all parts are available
  if (year && month && day && hour && minute && second && dayPeriod) {
    return `${year}-${month}-${day} ${hour}:${minute}:${second} ${dayPeriod}`;
  } else {
    // Fallback if formatting parts failed for some reason
    console.warn(`[${new Date().toISOString()}] formatTimestampToIST - Could not format all parts. Falling back to default toLocaleString.`);
    return new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }); 
  }
}

// --- PostgreSQL Database Initialization Function ---
/**
 * Initializes the connection to the PostgreSQL database.
 * Tests the connection and loads initial paper trading settings if available.
 * Updates the `postgresDbInitialized` flag and `currentPaperSettingsStub`.
 */
async function initializePostgresDb() {
  let client;
  try {
    console.log("Attempting to connect to PostgreSQL database...");
    client = await dbPool.connect(); // Get a client from the pool
    const res = await client.query('SELECT NOW()'); // Test query
    console.log("Successfully connected to PostgreSQL database at:", res.rows[0].now);
    
    postgresDbInitialized = true; // Set flag to true on successful connection
    currentPaperSettingsStub.persistenceEnabled = true;
    currentPaperSettingsStub.persistenceStatus = 'db_connected';

    // Attempt to load initial settings from the 'PaperSettings' table in the DB
    // to synchronize the in-memory stub.
    try {
        const result = await client.query("SELECT key, value_text, value_numeric, value_boolean FROM PaperSettings");
        if (result.rows.length > 0) {
            // Populate stub with values from DB
            result.rows.forEach(row => {
                if (row.key === 'initialBudget' && row.value_numeric !== null) currentPaperSettingsStub.initialBudget = parseFloat(row.value_numeric);
                if (row.key === 'currentBalance' && row.value_numeric !== null) currentPaperSettingsStub.currentBalance = parseFloat(row.value_numeric);
                if (row.key === 'sessionActive' && row.value_boolean !== null) currentPaperSettingsStub.sessionActive = row.value_boolean;
            });
            console.log("Initial paper settings loaded from PostgreSQL into memory stub.");
        } else {
            // If PaperSettings table is empty, use defaults and insert them.
            console.log("PaperSettings table is empty. Initializing with default values.");
            currentPaperSettingsStub.sessionActive = false; // Explicitly set default for stub
            // Insert all default keys correctly
            await client.query(`
                INSERT INTO PaperSettings (key, value_numeric, value_boolean, last_modified)
                VALUES
                    ('initialBudget', $1, NULL, NOW()),
                    ('currentBalance', $2, NULL, NOW()),
                    ('sessionActive', NULL, $3, NOW())
                ON CONFLICT (key) DO NOTHING
            `, [currentPaperSettingsStub.initialBudget, currentPaperSettingsStub.currentBalance, currentPaperSettingsStub.sessionActive]);
            console.log("Inserted default paper settings into PostgreSQL.");
        }
    } catch (loadErr) {
        console.error("Error loading/inserting initial paper settings from/to PostgreSQL:", loadErr.message, "Using default in-memory stub values.");
        // Keep postgresDbInitialized as true but reflect the error in stub
        currentPaperSettingsStub.persistenceStatus = 'db_query_failed';
        currentPaperSettingsStub.error = `Error during initial settings load: ${loadErr.message}`;
    }
  } catch (error) {
    // Handle connection failure
    console.error("Failed to connect to PostgreSQL database:", error.message);
    postgresDbInitialized = false;
    currentPaperSettingsStub.persistenceEnabled = false;
    currentPaperSettingsStub.persistenceStatus = 'db_connection_failed';
    currentPaperSettingsStub.error = "DB connection failed";
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool if it was acquired
    }
  }
}

// Call the initialization function on server startup.
initializePostgresDb();

// --- Express Middleware Setup ---
app.use(cors()); // Enables CORS for all routes, allowing requests from different origins (e.g., frontend on a different port).
app.use(express.json()); // Parses incoming request bodies with JSON payloads, making them available in req.body.

// --- Helper Function: Dhan API Request Wrapper ---
/**
 * Makes an authenticated HTTP request to the Dhan API.
 * @param {string} endpointPath - The API endpoint path (e.g., '/v1/scrips/search').
 * @param {string} [method='GET'] - The HTTP method (GET, POST, PUT, DELETE).
 * @param {object|null} [body=null] - The request body for POST/PUT requests.
 * @param {object} [additionalHeaders={}] - Any additional headers to include.
 * @returns {Promise<object>} A promise that resolves to the JSON response from Dhan API.
 * @throws {Error} If Dhan Access Token is not configured or if the API request fails.
 */
async function makeDhanApiRequest(endpointPath, method = 'GET', body = null, additionalHeaders = {}) {
  // Check if Dhan Access Token is configured
  if (!DHAN_ACCESS_TOKEN) {
    console.warn("Warning: DHAN_ACCESS_TOKEN is not set. Dhan API calls will likely fail.");
    throw new Error("Dhan Access Token is not configured on the server.");
  }
  
  const url = `${DHAN_API_BASE_URL}${endpointPath}`; // Construct the full API URL
  const headers = {
    'access-token': DHAN_ACCESS_TOKEN, // Dhan API access token
    'Content-Type': 'application/json', // Assuming JSON content type for requests
    'Accept': 'application/json',       // Expecting JSON response
    ...additionalHeaders,               // Spread any additional custom headers
  };
  
  const options = { method, headers, timeout: 15000 }; // Request options, including a 15s timeout
  
  // Add request body if method is POST, PUT, or PATCH
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  // Log the outgoing request
  console.log(`Making Dhan API Request: ${method} ${url}`);
  if(body) console.log('Request Body Preview (first 500 chars):', JSON.stringify(body, null, 2).substring(0, 500));
  
  try {
    const response = await fetch(url, options); // Make the HTTP request using node-fetch
    
    // Check if the response status is not OK (e.g., 4xx or 5xx)
    if (!response.ok) {
      let errorData = { message: response.statusText }; // Default error message
      try {
        const text = await response.text(); // Attempt to read error response body as text
        if (text) { errorData = JSON.parse(text); } // Try parsing text as JSON
      } catch (e) {
        // If parsing fails or text is empty, use the raw text or statusText
        errorData.message = (await response.text()) || response.statusText; 
        console.warn(`Could not parse JSON error response from Dhan for ${url}: ${e.message}. Raw error response: ${errorData.message}`);
      }
      // Log the error details
      console.error(`Dhan API Error (${response.status}) for ${url}:`, errorData.message || response.statusText, 'Details:', errorData);
      // Create a new Error object with details from Dhan's response
      const err = new Error(errorData.internalErrorCode || errorData.errorCode || errorData.message || `Dhan API request failed with status ${response.status}`);
      if (errorData.internalErrorCode || errorData.errorCode) {
        err.dhanErrorCode = errorData.internalErrorCode || errorData.errorCode; // Add custom Dhan error code property
      }
      throw err; // Throw the error to be caught by the caller
    }
    
    // Handle successful responses that might not have a body (e.g., 204 No Content, 202 Accepted)
    if (response.status === 204 || response.status === 202) { 
        return { status: 'success', httpStatus: response.status, message: response.statusText || 'Operation successful.' };
    }
    
    const responseJson = await response.json(); // Parse successful response as JSON
    
    // Dhan specific: map 'orderld' to 'orderId' if it exists (for consistency in Super Order responses)
    if (responseJson && responseJson.orderld && !responseJson.orderId) {
        responseJson.orderId = responseJson.orderld;
        delete responseJson.orderld;
    }
    return responseJson; // Return the parsed JSON response
  } catch (error) {
    // Catch network errors or errors thrown from non-ok responses
    console.error(`Error in makeDhanApiRequest for ${url}:`, error.message);
    error.dhanRequestPath = endpointPath; // Add request path to the error for better context
    throw error; // Re-throw the error
  }
}

// --- PostgreSQL Database Helper Functions ---
/**
 * Executes a SQL query using the connection pool.
 * @param {string} sql - The SQL query string.
 *   (e.g., "SELECT * FROM users WHERE id = $1", params = [1])
 * @param {Array<any>} [params=[]] - Optional array of parameters for the query.
 * @returns {Promise<import('pg').QueryResult>} A promise that resolves to the query result.
 * @throws {Error} If the database is not initialized.
 */
async function queryDb(sql, params = []) {
  if (!postgresDbInitialized) {
    // Prevent DB operations if connection failed
    throw new Error("Database not initialized. Cannot execute query.");
  }
  const client = await dbPool.connect(); // Get a client from the pool
  try {
    // Execute the query with provided parameters
    const result = await client.query(sql, params);
    return result; // Return the query result object
  } finally {
    client.release(); // Always release the client back to the pool
  }
}

// --- API ROUTES (Dhan Live Trading & General - Proxies to Dhan API) ---

// Health check route for the backend server itself.
app.get('/', (req, res) => {
  res.status(200).send('Dhan AI Trading Agent Backend is healthy and running.');
});

// General API health check.
app.get('/api', (req, res) => {
  res.status(200).send('Dhan AI Trading Agent Backend API is responsive.');
});

// Route to search for instruments (stocks, derivatives, etc.).
// Proxies to Dhan's /v1/scrips/search endpoint.
app.get('/api/instruments/search', async (req, res) => { 
  // Implementation details for this route (and similar Dhan proxy routes below) are in the full server.js.
  // They typically involve:
  // 1. Extracting query parameters or body from `req`.
  // 2. Constructing the payload for the `makeDhanApiRequest` function.
  // 3. Calling `makeDhanApiRequest` with the appropriate Dhan endpoint path and payload.
  // 4. Sending the response from `makeDhanApiRequest` (or an error) back to the client via `res`.
  /* ... existing Dhan search logic from the provided server.js ... */ 
});

// Route to get user's current holdings.
// Proxies to Dhan's /v2/holdings endpoint.
app.get('/api/portfolio/holdings', async (req, res) => { /* ... */ });

// Route to get user's current open positions.
// Proxies to Dhan's /v2/positions endpoint.
app.get('/api/portfolio/positions', async (req, res) => { /* ... */ });

// Route to convert an open position from one product type to another.
// Proxies to Dhan's /v2/positions/convert endpoint.
app.post('/api/portfolio/positions/convert', async (req, res) => { /* ... */ });

// Route to place a new order.
// Proxies to Dhan's /orders/v1 endpoint.
app.post('/api/orders/place', async (req, res) => { /* ... */ });

// Route to get the user's order book (list of all orders).
// Proxies to Dhan's /v2/orders endpoint.
app.get('/api/orders', async (req, res) => { /* ... */ });

// Route to get user's fund limits.
// Proxies to Dhan's /v2/fundlimit endpoint.
app.get('/api/account/fundlimit', async (req, res) => { /* ... */ });

// Route to get historical daily chart data for an instrument.
// Proxies to Dhan's /v2/charts/historical endpoint.
app.post('/api/charts/historical', async (req, res) => { /* ... */ });

// Route to get historical intraday chart data for an instrument.
// Proxies to Dhan's /v2/charts/intraday endpoint.
app.post('/api/charts/intraday', async (req, res) => { /* ... */ });

// Route to calculate margin requirements for an order.
// Proxies to Dhan's /v2/margincalculator endpoint.
app.post('/api/margincalculator', async (req, res) => { /* ... */ });

// Route to place a Super Order (Bracket/Cover Order).
// Proxies to Dhan's /v2/super/orders endpoint (POST).
app.post('/api/super/orders', async (req, res) => { /* ... */ });

// Route to get a list of user's Super Orders.
// Proxies to Dhan's /v2/super/orders endpoint (GET).
app.get('/api/super/orders', async (req, res) => { /* ... */ });

// Route to modify an existing Super Order.
// Proxies to Dhan's /v2/super/orders/{orderId} endpoint (PUT).
app.put('/api/super/orders/:orderId', async (req, res) => { /* ... */ });

// Route to cancel a leg of a Super Order.
// Proxies to Dhan's /v2/super/orders/{orderId}/{legName} endpoint (DELETE).
app.delete('/api/super/orders/:orderId/:legName', async (req, res) => { /* ... */ });


// --- PAPER TRADING ENDPOINTS (Interacting with PostgreSQL Database) ---

/**
 * GET /api/paper-trading/data
 * Fetches all current paper trading data including settings, holdings, ledger, and history.
 * If PostgreSQL is not initialized, it serves data from the in-memory stub.
 */
app.get('/api/paper-trading/data', async (req, res) => {
  // `effectiveSettings` combines the in-memory stub with the current DB connection status.
  const effectiveSettings = { 
      ...currentPaperSettingsStub, 
      persistenceEnabled: postgresDbInitialized, 
      persistenceStatus: postgresDbInitialized ? 'db_connected' : 'db_connection_failed',
      error: !postgresDbInitialized ? "DB connection failed" : undefined,
  };

  // If DB is not connected, return in-memory/default data.
  if (!postgresDbInitialized) { 
      console.warn("Paper trading data request: PostgreSQL DB not connected. Serving default/in-memory stub data.");
      return res.json({ 
          settings: effectiveSettings, holdings: [], ledger: [], history: [] 
      });
  }

  try {
    // Fetch current settings from PaperSettings table.
    const settingsRes = await queryDb("SELECT key, value_text, value_numeric, value_boolean FROM PaperSettings");
    settingsRes.rows.forEach(row => { // Update effectiveSettings with DB values.
        if (row.key === 'initialBudget' && row.value_numeric !== null) effectiveSettings.initialBudget = parseFloat(row.value_numeric); else if (row.key === 'initialBudget') effectiveSettings.initialBudget = 100000;
        if (row.key === 'currentBalance' && row.value_numeric !== null) effectiveSettings.currentBalance = parseFloat(row.value_numeric); else if (row.key === 'currentBalance') effectiveSettings.currentBalance = 100000;
        if (row.key === 'sessionActive' && row.value_boolean !== null) effectiveSettings.sessionActive = row.value_boolean; else if (row.key === 'sessionActive') effectiveSettings.sessionActive = false;
    });
    
    // Fetch paper holdings.
    const holdingsRes = await queryDb("SELECT security_id, symbol, exchange, quantity, avg_price, ltp, isin, dhan_client_id FROM PaperHoldings");
    const holdings = holdingsRes.rows.map(r => ({ // Map DB rows to frontend DhanHolding type.
        securityId: r.security_id, tradingSymbol: r.symbol, exchange: r.exchange,
        totalQty: parseInt(r.quantity, 10), availableQty: parseInt(r.quantity, 10), 
        averageCostPrice: parseFloat(r.avg_price), ltp: r.ltp ? parseFloat(r.ltp) : parseFloat(r.avg_price), 
        isin: r.isin || 'N/A', dhanClientId: r.dhan_client_id || 'PAPER_CLIENT' // Default client ID for paper
    }));

    // Fetch paper ledger entries, ordered by timestamp.
    const ledgerRes = await queryDb("SELECT ledger_id, timestamp, description, type, amount, balance_after_txn FROM PaperLedger ORDER BY timestamp DESC");
    const ledger = ledgerRes.rows.map(r => ({ // Map DB rows to frontend PaperLedgerEntry type.
        id: r.ledger_id, timestamp: formatTimestampToIST(r.timestamp), description: r.description, type: r.type,
        amount: parseFloat(r.amount), balance: parseFloat(r.balance_after_txn)
    }));
    
    // Fetch paper trade history, ordered by creation time.
    const historyRes = await queryDb("SELECT order_id, trading_symbol, transaction_type, quantity, avg_traded_price, order_status, created_time, security_id, exchange_segment, product_type, order_type, correlation_id, dhan_client_id, filled_qty, price, trigger_price, validity, oms_error_description FROM PaperTradeHistory ORDER BY created_time DESC");
    const history = historyRes.rows.map(r => ({ // Map DB rows to frontend DhanOrderResponse type.
        orderId: r.order_id, tradingSymbol: r.trading_symbol, transactionType: r.transaction_type,
        quantity: parseInt(r.quantity, 10), averageTradedPrice: parseFloat(r.avg_traded_price),
        orderStatus: r.order_status, createdTime: formatTimestampToIST(r.created_time), securityId: r.security_id,
        exchangeSegment: r.exchange_segment, productType: r.product_type, orderType: r.order_type,
        correlationId: r.correlation_id, dhanClientId: r.dhan_client_id, 
        filledQty: r.filled_qty ? parseInt(r.filled_qty, 10) : parseInt(r.quantity, 10), // Default filled to total quantity
        price: r.price ? parseFloat(r.price) : 0, 
        triggerPrice: r.trigger_price ? parseFloat(r.trigger_price) : 0, 
        validity: r.validity, omsErrorDescription: r.oms_error_description
    }));
    
    // Update the in-memory stub with the latest DB settings.
    currentPaperSettingsStub = {...effectiveSettings }; 
    res.json({ settings: effectiveSettings, holdings, ledger, history });

  } catch (error) {
    // Handle errors during DB fetch.
    console.error("Error fetching paper trading data from PostgreSQL:", error);
    const errorSettings = { 
        ...currentPaperSettingsStub, // Fallback to current stub state
        persistenceEnabled: postgresDbInitialized, 
        persistenceStatus: "db_query_failed", 
        error: `Failed to fetch paper trading data from DB: ${error.message}`
    };
    res.status(500).json({ settings: errorSettings, holdings: [], ledger: [], history: [] }); 
  }
});

/**
 * POST /api/paper-trading/session
 * Starts a new paper trading session or redefines the budget for an existing one.
 * Requires `initialBudget` (number) and `mode` ('reset' or 'redefine') in the request body.
 * Uses PostgreSQL transactions for atomicity.
 */
app.post('/api/paper-trading/session', async (req, res) => {
  const { initialBudget: newInitialBudget, mode = 'reset' } = req.body; 
  let persistenceOperationStatus = postgresDbInitialized ? "pending_db_operation" : "db_connection_failed";
  let dbErrorOccurred = !postgresDbInitialized;

  // Validate input budget.
  if (typeof newInitialBudget !== 'number' || newInitialBudget <= 0) {
    return res.status(400).json({ message: "Valid initialBudget (positive number) is required." });
  }

  // Prepare settings object for response, reflecting current DB status.
  let finalSettings = { 
    initialBudget: newInitialBudget, 
    currentBalance: newInitialBudget, 
    sessionActive: true, 
    persistenceEnabled: postgresDbInitialized,
    persistenceStatus: persistenceOperationStatus,
    error: dbErrorOccurred ? "DB connection failed" : undefined,
  };
  
  // If DB not connected, simulate in memory.
  if (!postgresDbInitialized) {
    console.warn("Paper trading session management: PostgreSQL DB not connected. Simulating in memory.");
    // Update in-memory stub based on mode (reset or redefine logic).
    if (mode === 'redefine') {
      const budgetAdjustment = newInitialBudget - currentPaperSettingsStub.initialBudget;
      finalSettings.currentBalance = currentPaperSettingsStub.currentBalance + budgetAdjustment;
    } // For 'reset', initialBudget and currentBalance are already newInitialBudget.
    currentPaperSettingsStub = {...finalSettings, persistenceEnabled: false, persistenceStatus: "stubbed_session_no_db"};
    return res.json(currentPaperSettingsStub);
  }

  // If DB is connected, proceed with database operations.
  const client = await dbPool.connect(); // Get a client for transaction.
  try {
    await client.query('BEGIN'); // Start a database transaction.

    let ledgerDescription = '';
    let ledgerAmount = newInitialBudget;
    let ledgerType = 'INFO'; 
    
    // Fetch current budget and balance from DB for 'redefine' mode calculations.
    let oldInitialBudget = currentPaperSettingsStub.initialBudget; // Fallback
    let oldCurrentBalance = currentPaperSettingsStub.currentBalance; // Fallback
    const currentDbSettings = await client.query("SELECT key, value_numeric FROM PaperSettings WHERE key IN ('initialBudget', 'currentBalance')");
    currentDbSettings.rows.forEach(r => {
        if(r.key === 'initialBudget' && r.value_numeric !== null) oldInitialBudget = parseFloat(r.value_numeric);
        if(r.key === 'currentBalance' && r.value_numeric !== null) oldCurrentBalance = parseFloat(r.value_numeric);
    });

    if (mode === 'redefine') {
      // Calculate budget adjustment and new current balance.
      const budgetAdjustment = newInitialBudget - oldInitialBudget;
      const newCurrentBalance = oldCurrentBalance + budgetAdjustment;
      finalSettings.currentBalance = newCurrentBalance;
      // Prepare ledger entry details.
      ledgerDescription = `Budget Redefined. Adjustment: ${budgetAdjustment >= 0 ? '+' : ''}${budgetAdjustment.toFixed(2)}. New Initial Budget: ${newInitialBudget.toFixed(2)}, New Current Balance: ${newCurrentBalance.toFixed(2)}.`;
      ledgerAmount = Math.abs(budgetAdjustment);
      ledgerType = budgetAdjustment > 0 ? 'CREDIT' : (budgetAdjustment < 0 ? 'DEBIT' : 'INFO');
    } else { // mode === 'reset'
      // Clear all previous paper trading data.
      await client.query("DELETE FROM PaperHoldings");
      await client.query("DELETE FROM PaperLedger");
      await client.query("DELETE FROM PaperTradeHistory");
      // Prepare ledger entry for new session.
      ledgerDescription = 'New Paper Trading Session Started. Initial Budget Set.';
      ledgerAmount = newInitialBudget;
      finalSettings.currentBalance = newInitialBudget; // Balance is same as initial budget on reset.
    }

    // Update 'initialBudget'
    await client.query(
      `INSERT INTO PaperSettings (key, value_numeric, value_boolean, last_modified)
       VALUES ('initialBudget', $1, NULL, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value_numeric = EXCLUDED.value_numeric,
         value_boolean = NULL,
         last_modified = NOW()`,
      [finalSettings.initialBudget]
    );

    // Update 'currentBalance'
    await client.query(
      `INSERT INTO PaperSettings (key, value_numeric, value_boolean, last_modified)
       VALUES ('currentBalance', $1, NULL, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value_numeric = EXCLUDED.value_numeric,
         value_boolean = NULL,
         last_modified = NOW()`,
      [finalSettings.currentBalance]
    );

    // Update 'sessionActive'
    await client.query(
      `INSERT INTO PaperSettings (key, value_numeric, value_boolean, last_modified)
       VALUES ('sessionActive', NULL, TRUE, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value_numeric = NULL,
         value_boolean = EXCLUDED.value_boolean,
         last_modified = NOW()`
    );
    
    // Create a new ledger entry for this session action.
    const ledgerEntryTimestamp = new Date(); // Current timestamp for the entry.
    const ledgerId = `ledger_${Date.now()}`; // Generate a unique ID for the ledger entry.
    await client.query("INSERT INTO PaperLedger (ledger_id, timestamp, description, type, amount, balance_after_txn) VALUES ($1, $2, $3, $4, $5, $6)", [ledgerId, ledgerEntryTimestamp, ledgerDescription, ledgerType, ledgerAmount, finalSettings.currentBalance]);
    
    await client.query('COMMIT'); // Commit the transaction if all operations succeed.
    persistenceOperationStatus = "db_success";
    // Update in-memory stub with final settings.
    currentPaperSettingsStub = {...finalSettings, persistenceEnabled: true, persistenceStatus, error: undefined};
    res.json(currentPaperSettingsStub); // Send updated settings back to client.

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction on any error.
    console.error("Error starting/redefining paper session with PostgreSQL:", error);
    dbErrorOccurred = true;
    persistenceOperationStatus = "db_transaction_failed";
    // Prepare error response settings.
    const errorResponseSettings = {
        ...currentPaperSettingsStub, // Fallback to current stub state
        initialBudget: mode === 'reset' ? newInitialBudget : currentPaperSettingsStub.initialBudget,
        currentBalance: mode === 'reset' ? newInitialBudget : currentPaperSettingsStub.currentBalance,
        sessionActive: false, // Session considered inactive on error
        persistenceEnabled: postgresDbInitialized,
        error: `Failed to start/redefine paper session: ${error.message}`,
        persistenceStatus: persistenceOperationStatus,
    };
    currentPaperSettingsStub = {...errorResponseSettings}; // Update stub with error state.
    res.status(500).json(errorResponseSettings); // Send error response.
  } finally {
    client.release(); // Always release the DB client.
  }
});

/**
 * POST /api/paper-trading/trade
 * Simulates a paper trade (buy or sell).
 * Requires `orderRequest` (DhanOrderRequest compatible) and `currentStockPriceForFill` in the body.
 * Updates paper balance, holdings, ledger, and trade history in PostgreSQL.
 * Uses PostgreSQL transactions for atomicity.
 */
app.post('/api/paper-trading/trade', async (req, res) => {
  const { orderRequest, currentStockPriceForFill } = req.body; 
  let persistenceOperationStatus = postgresDbInitialized ? "pending_db_operation" : "db_connection_failed";
  let dbErrorOccurred = !postgresDbInitialized;
  
  // Fetch latest balance, budget, and session status from DB if connected,
  // otherwise use in-memory stub values.
  let effectiveBalance = currentPaperSettingsStub.currentBalance;
  let effectiveInitialBudget = currentPaperSettingsStub.initialBudget; 
  let effectiveSessionActive = currentPaperSettingsStub.sessionActive;

  if (postgresDbInitialized) {
    try {
        const settingsRes = await queryDb("SELECT key, value_numeric, value_boolean FROM PaperSettings WHERE key IN ('currentBalance', 'initialBudget', 'sessionActive')");
        settingsRes.rows.forEach(r => {
            if (r.key === 'currentBalance' && r.value_numeric !== null) effectiveBalance = parseFloat(r.value_numeric);
            if (r.key === 'initialBudget' && r.value_numeric !== null) effectiveInitialBudget = parseFloat(r.value_numeric);
            if (r.key === 'sessionActive' && r.value_boolean !== null) effectiveSessionActive = r.value_boolean;
        });
    } catch (e) {
        // If DB read fails, log warning and use stub. Mark as DB error.
        console.warn("Could not fetch latest paper balance from DB for trade, using in-memory stub. Error:", e.message);
        dbErrorOccurred = true; 
        persistenceOperationStatus = "db_read_failed"; 
    }
  }

  // Check if paper trading session is active.
  if (!effectiveSessionActive) {
     return res.status(400).json({ message: "Paper trading session is not active. Cannot execute trade."});
  }

  const tradeValue = orderRequest.quantity * currentStockPriceForFill; // Calculate total value of the trade.
  const executedOrderTimestamp = new Date(); // Timestamp for the trade.

  // Handle insufficient funds for BUY orders.
  if (orderRequest.transactionType === 'BUY' && effectiveBalance < tradeValue) {
    // Construct a rejected order object.
    const rejectedOrder = { 
        orderId: `PAPER_REJ_${Date.now()}`,
        tradingSymbol: orderRequest.tradingSymbol || orderRequest.securityId,
        transactionType: orderRequest.transactionType,
        quantity: orderRequest.quantity,
        orderType: orderRequest.orderType,
        productType: orderRequest.productType,
        validity: orderRequest.validity,
        correlationId: orderRequest.correlationId,
        omsErrorDescription: "Insufficient paper funds."
     }; 
     // If DB connected, log the rejected trade to history.
     if(postgresDbInitialized) {
        try {
             await queryDb("INSERT INTO PaperTradeHistory (order_id, trading_symbol, transaction_type, quantity, avg_traded_price, order_status, created_time, security_id, exchange_segment, product_type, order_type, correlation_id, dhan_client_id, filled_qty, price, trigger_price, validity, oms_error_description, last_modified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())",
                [rejectedOrder.orderId, rejectedOrder.tradingSymbol, rejectedOrder.transactionType, rejectedOrder.quantity, 0, 'PAPER_REJECTED', executedOrderTimestamp, orderRequest.securityId, orderRequest.exchangeSegment, rejectedOrder.productType, rejectedOrder.orderType, rejectedOrder.correlationId, 'PAPER_CLIENT', 0, orderRequest.price || 0, orderRequest.triggerPrice || 0, orderRequest.validity, rejectedOrder.omsErrorDescription]);
             persistenceOperationStatus = "db_success_partial_log"; // Indicates only log was successful.
        } catch(e) { console.error("Failed to log rejected paper trade to DB history:", e); persistenceOperationStatus = "db_write_failed"; dbErrorOccurred = true; }
     }
    return res.status(400).json({ 
        message: "Insufficient paper funds.", 
        executedOrder: rejectedOrder, 
        updatedSettings: { ...currentPaperSettingsStub, initialBudget: effectiveInitialBudget, currentBalance: effectiveBalance, sessionActive: effectiveSessionActive, persistenceEnabled: postgresDbInitialized, error: "Insufficient paper funds.", persistenceStatus: persistenceOperationStatus},
        updatedHoldings: [], // No change to holdings on rejection
        newLedgerEntry: null 
    });
  }
  
  // Construct the executed order object (simulating a successful trade).
  const executedOrder = { 
      orderId: `PAPER_ORD_${Date.now()}`,
      tradingSymbol: orderRequest.tradingSymbol || orderRequest.securityId,
      transactionType: orderRequest.transactionType,
      quantity: orderRequest.quantity,
      averageTradedPrice: currentStockPriceForFill,
      orderStatus: 'PAPER_TRADED',
      createdTime: executedOrderTimestamp.toISOString(), // Use ISO string for DB.
      securityId: orderRequest.securityId,
      exchangeSegment: orderRequest.exchangeSegment,
      productType: orderRequest.productType,
      orderType: orderRequest.orderType,
      correlationId: orderRequest.correlationId || `PAPER_AI_${Date.now()}`,
      dhanClientId: 'PAPER_CLIENT',
      filledQty: orderRequest.quantity,
      price: orderRequest.price || currentStockPriceForFill, // If market, use fill price
      triggerPrice: orderRequest.triggerPrice || 0,
      validity: orderRequest.validity,
      omsErrorDescription: null
  }; 

  // Update balance and construct ledger entry.
  const updatedBalance = orderRequest.transactionType === 'BUY' ? effectiveBalance - tradeValue : effectiveBalance + tradeValue;
  currentPaperSettingsStub.currentBalance = updatedBalance; // Update in-memory stub immediately.
  const updatedSettingsForResponse = { ...currentPaperSettingsStub, initialBudget: effectiveInitialBudget, sessionActive: effectiveSessionActive, persistenceEnabled: postgresDbInitialized }; 
  const newLedgerEntry = { 
      id: `pledger_${Date.now()}`,
      timestamp: formatTimestampToIST(executedOrderTimestamp), // Format timestamp for response.
      description: `${orderRequest.transactionType} ${orderRequest.quantity} ${executedOrder.tradingSymbol} @ ${currentStockPriceForFill.toFixed(2)}. Order ID: ${executedOrder.orderId}`,
      type: orderRequest.transactionType === 'BUY' ? 'DEBIT' : 'CREDIT',
      amount: tradeValue,
      balance: updatedBalance
   };

  let updatedHoldingsFromDb = []; // To store holdings fetched after DB update.
  
  // If DB is connected, perform all updates within a transaction.
  if (postgresDbInitialized) {
    const client = await dbPool.connect(); // Get a client for transaction.
    try {
        await client.query('BEGIN'); // Start transaction.
        
        // Update current balance in PaperSettings.
        await client.query("UPDATE PaperSettings SET value_numeric = $1, last_modified = NOW() WHERE key = 'currentBalance'", [updatedBalance]);
        
        // Insert new ledger entry.
        await client.query("INSERT INTO PaperLedger (ledger_id, timestamp, description, type, amount, balance_after_txn) VALUES ($1, $2, $3, $4, $5, $6)", [newLedgerEntry.id, executedOrderTimestamp, newLedgerEntry.description, newLedgerEntry.type, newLedgerEntry.amount, newLedgerEntry.balance]);
        
        // Insert executed trade into PaperTradeHistory.
        await client.query("INSERT INTO PaperTradeHistory (order_id, trading_symbol, transaction_type, quantity, avg_traded_price, order_status, created_time, security_id, exchange_segment, product_type, order_type, correlation_id, dhan_client_id, filled_qty, price, trigger_price, validity, oms_error_description, last_modified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())",
            [executedOrder.orderId, executedOrder.tradingSymbol, executedOrder.transactionType, executedOrder.quantity, executedOrder.averageTradedPrice, executedOrder.orderStatus, executedOrderTimestamp, orderRequest.securityId, orderRequest.exchangeSegment, orderRequest.productType, orderRequest.orderType, executedOrder.correlationId, executedOrder.dhanClientId, executedOrder.filledQty, executedOrder.price, executedOrder.triggerPrice, executedOrder.validity, executedOrder.omsErrorDescription]);
        
        // Update PaperHoldings table.
        const holdingRes = await client.query("SELECT quantity, avg_price FROM PaperHoldings WHERE security_id = $1 AND exchange = $2", [orderRequest.securityId, orderRequest.exchangeSegment]);
        if (orderRequest.transactionType === 'BUY') {
            if (holdingRes.rows.length > 0) { // If holding exists, update it.
                const existing = holdingRes.rows[0];
                const newQuantity = parseInt(existing.quantity,10) + orderRequest.quantity;
                const newAvgPrice = ((parseFloat(existing.avg_price) * parseInt(existing.quantity,10)) + (currentStockPriceForFill * orderRequest.quantity)) / newQuantity;
                await client.query("UPDATE PaperHoldings SET quantity = $1, avg_price = $2, ltp = $3, last_modified = NOW() WHERE security_id = $4 AND exchange = $5", [newQuantity, newAvgPrice, currentStockPriceForFill, orderRequest.securityId, orderRequest.exchangeSegment]);
            } else { // If holding doesn't exist, insert new row.
                await client.query("INSERT INTO PaperHoldings (security_id, symbol, exchange, quantity, avg_price, ltp, isin, dhan_client_id, last_modified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())", [orderRequest.securityId, executedOrder.tradingSymbol, orderRequest.exchangeSegment, orderRequest.quantity, currentStockPriceForFill, currentStockPriceForFill, 'N/A', 'PAPER_CLIENT']);
            }
        } else { // SELL transaction
            if (holdingRes.rows.length > 0) { // If holding exists, update or delete.
                const existing = holdingRes.rows[0];
                const newQuantity = parseInt(existing.quantity,10) - orderRequest.quantity;
                if (newQuantity <= 0) { // If quantity becomes zero or less, delete the holding.
                    await client.query("DELETE FROM PaperHoldings WHERE security_id = $1 AND exchange = $2", [orderRequest.securityId, orderRequest.exchangeSegment]);
                } else { // Otherwise, update the quantity and ltp.
                    await client.query("UPDATE PaperHoldings SET quantity = $1, ltp = $2, last_modified = NOW() WHERE security_id = $3 AND exchange = $4", [newQuantity, currentStockPriceForFill, orderRequest.securityId, orderRequest.exchangeSegment]);
                }
            } else { // Selling a stock not in holdings (e.g., for short selling simulation if supported).
                console.warn("DB Paper trade: Selling stock not in DB holdings.", orderRequest.securityId); 
                // Could insert a negative quantity holding here if short selling is to be modeled.
            }
        }
        await client.query('COMMIT'); // Commit transaction.
        
        // Fetch the updated list of all holdings to send back to client.
        const finalHoldingsRes = await queryDb("SELECT security_id, symbol, exchange, quantity, avg_price, ltp, isin, dhan_client_id FROM PaperHoldings");
        updatedHoldingsFromDb = finalHoldingsRes.rows.map(r => ({ 
            securityId: r.security_id, tradingSymbol: r.symbol, exchange: r.exchange,
            totalQty: parseInt(r.quantity, 10), availableQty: parseInt(r.quantity, 10), 
            averageCostPrice: parseFloat(r.avg_price), ltp: r.ltp ? parseFloat(r.ltp) : parseFloat(r.avg_price), 
            isin: r.isin || 'N/A', dhanClientId: r.dhan_client_id || 'PAPER_CLIENT'
        }));
        persistenceOperationStatus = "db_success";
    } catch (dbError) {
        await client.query('ROLLBACK'); // Rollback on error.
        console.error("Error persisting paper trade to PostgreSQL:", dbError);
        persistenceOperationStatus = "db_transaction_failed"; 
        dbErrorOccurred = true; 
    } finally {
        client.release(); // Release client.
    }
  }
  
  // Update response settings with final persistence status and any error messages.
  updatedSettingsForResponse.persistenceStatus = persistenceOperationStatus;
  updatedSettingsForResponse.error = dbErrorOccurred ? (updatedSettingsForResponse.error || "DB operation failed during trade.") : undefined;

  // Send response to client.
  res.json({ executedOrder, updatedSettings: updatedSettingsForResponse, updatedHoldings: updatedHoldingsFromDb, newLedgerEntry });
});


// --- Server Startup ---
// Starts the Express server, listening on the configured PORT and all network interfaces ('0.0.0.0').
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server for Dhan AI Trading Agent is listening on http://0.0.0.0:${PORT} or http://localhost:${PORT} for local deployment.`);
  // Log status of Dhan API credentials.
  if (!DHAN_ACCESS_TOKEN || !DHAN_CLIENT_ID && process.env.NODE_ENV !== 'test') {
    console.warn("Warning: DHAN_ACCESS_TOKEN or DHAN_CLIENT_ID is not set. API calls to Dhan may fail or be limited.");
  } else if (process.env.NODE_ENV !== 'test') {
    console.log("DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID are configured.");
  }
  // Log PostgreSQL connection status.
  if (!postgresDbInitialized) {
    console.warn("Warning: PostgreSQL DB connection failed or not configured. Paper trading persistence will be emulated in memory only (if at all).");
  } else {
     console.log("PostgreSQL DB connection successful. Paper trading persistence is active via DB.");
  }
});

// --- Placeholder for full Dhan proxy route implementations ---
// The following are stubs for the Dhan API proxy routes. 
// Their detailed implementations (extracting params, calling makeDhanApiRequest, error handling)
// were provided in the full server.js and are omitted here for brevity but assumed to be present.

app.get('/api/instruments/search', async (req, res) => {
  const searchTerm = (req.query.term || '').toUpperCase(); 
  const feSegment = req.query.segment || 'NSE_EQ'; // Default to NSE Equity if not specified
  if (!searchTerm) return res.status(400).json({ message: 'Search term is required' });
  // Map frontend segment to Dhan API segment codes
  let exchange = 'NSE'; let dhanSegmentCode = 'E'; let instrumentType = 'EQUITY'; 
  if (feSegment) { /* ... same mapping logic as before ... */ } // Placeholder for mapping logic
  const searchPayload = { searchText: searchTerm, exchange: exchange, segment: dhanSegmentCode, };
  if (instrumentType && dhanSegmentCode !== 'D' && dhanSegmentCode !== 'I') { searchPayload.instrumentType = instrumentType; }
  console.log(`Backend: Instrument search for term: "${searchTerm}", feSegment: "${feSegment}". Dhan Payload:`, searchPayload);
  try { const data = await makeDhanApiRequest('/v1/scrips/search', 'POST', searchPayload); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to search instruments: ${error.message}` }); }
});
app.get('/api/portfolio/holdings', async (req, res) => { 
  console.log('Backend: Request for user holdings (Dhan API v2/holdings)');
  try { const data = await makeDhanApiRequest('/v2/holdings'); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to fetch holdings: ${error.message}` }); }
});
app.get('/api/portfolio/positions', async (req, res) => { 
  console.log('Backend: Request for user positions (Dhan API v2/positions)');
  try { const data = await makeDhanApiRequest('/v2/positions'); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to fetch positions: ${error.message}` }); }
});
app.post('/api/portfolio/positions/convert', async (req, res) => {
  let convertRequest = req.body; console.log('Backend: Position conversion (Dhan API v2/positions/convert):', convertRequest);
  if (!DHAN_CLIENT_ID) { return res.status(500).json({ message: "DHAN_CLIENT_ID not configured for position conversion." }); }
  if (!convertRequest.dhanClientId) { convertRequest.dhanClientId = DHAN_CLIENT_ID; } 
  const requiredFields = ['dhanClientId', 'fromProductType', 'exchangeSegment', 'positionType', 'securityId', 'convertQty', 'toProductType'];
  for (const field of requiredFields) { if (!convertRequest[field] && !(field === 'tradingSymbol' && convertRequest[field]==='')) { return res.status(400).json({ message: `Missing field for position conversion: ${field}` }); } }
  try { const data = await makeDhanApiRequest('/v2/positions/convert', 'POST', convertRequest); res.status(data.httpStatus || 200).json(data); 
  } catch (error) { console.error(`Position conversion failed for ${convertRequest.securityId}:`, error); res.status(500).json({ message: `Failed to convert position: ${error.message}` }); }
});
app.post('/api/orders/place', async (req, res) => { 
  let orderRequest = req.body; console.log('Backend: Order placement (Dhan API orders/v1):', orderRequest);
  // Basic validation
  if (!orderRequest.securityId || !orderRequest.exchangeSegment || !orderRequest.transactionType || !orderRequest.productType || !orderRequest.orderType || !orderRequest.quantity || !orderRequest.validity ) { return res.status(400).json({ message: "Missing required order parameters." }); }
  if (!orderRequest.dhanClientId && DHAN_CLIENT_ID) { orderRequest.dhanClientId = DHAN_CLIENT_ID; }
  try { const data = await makeDhanApiRequest('/orders/v1', 'POST', orderRequest); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to place order: ${error.message}` }); }
});
app.get('/api/orders', async (req, res) => {
  console.log('Backend: Request for order book (Dhan API /v2/orders)');
  try { const data = await makeDhanApiRequest('/v2/orders'); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to fetch order book: ${error.message}` }); }
});
app.get('/api/account/fundlimit', async (req, res) => { 
  console.log('Backend: Request for fund limits (Dhan API /v2/fundlimit)');
  try { const data = await makeDhanApiRequest('/v2/fundlimit'); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to fetch fund limits: ${error.message}` }); }
});
app.post('/api/charts/historical', async (req, res) => { 
  const historicalRequest = req.body; console.log('Backend: Historical data (Dhan API /v2/charts/historical):', historicalRequest);
  try { const data = await makeDhanApiRequest('/v2/charts/historical', 'POST', historicalRequest); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to fetch historical data: ${error.message}`, status: "error", remarks: { title: "API Fetch Error", message: error.message } }); }
});
app.post('/api/charts/intraday', async (req, res) => { 
  const intradayRequest = req.body; console.log('Backend: Intraday data (Dhan API /v2/charts/intraday):', intradayRequest);
  try { const data = await makeDhanApiRequest('/v2/charts/intraday', 'POST', intradayRequest); res.json(data);
  } catch (error) { res.status(500).json({ message: `Failed to fetch intraday data: ${error.message}` }); }
});
app.post('/api/margincalculator', async (req, res) => { 
  let marginRequest = req.body; console.log('Backend: Margin calculator (Dhan API /v2/margincalculator):', marginRequest);
  if (!DHAN_CLIENT_ID) { return res.status(500).json({ message: "DHAN_CLIENT_ID not configured for margin calculation." }); }
  marginRequest.dhanClientId = DHAN_CLIENT_ID;
  const requiredFields = ['dhanClientId', 'exchangeSegment', 'transactionType', 'quantity', 'productType', 'securityId', 'price'];
  for (const field of requiredFields) { if (marginRequest[field] === undefined || marginRequest[field] === null || (typeof marginRequest[field] === 'string' && marginRequest[field].trim() === '')) { if ((field === 'quantity' || field === 'price') && typeof marginRequest[field] === 'number' && marginRequest[field] === 0) continue; return res.status(400).json({ message: `Missing field for margin calc: ${field}` }); } }
  try { const data = await makeDhanApiRequest('/v2/margincalculator', 'POST', marginRequest); res.json(data);
  } catch (error) { console.error(`Margin calc failed for ${marginRequest.securityId}:`, error); res.status(500).json({ message: `Failed to calculate margin: ${error.message}` }); }
});
app.post('/api/super/orders', async (req, res) => {
    let orderRequest = req.body; console.log('Backend: Place Super Order (Dhan API /v2/super/orders):', orderRequest);
    if (!DHAN_CLIENT_ID) { return res.status(500).json({ message: "DHAN_CLIENT_ID not configured for super orders." }); }
    orderRequest.dhanClientId = DHAN_CLIENT_ID; 
    // Add necessary validation for super order fields
    if (!orderRequest.securityId || !orderRequest.exchangeSegment || !orderRequest.transactionType || !orderRequest.productType || !orderRequest.orderType || !orderRequest.quantity || !orderRequest.targetPrice || !orderRequest.stopLossPrice ) { return res.status(400).json({ message: "Missing required parameters for super order." }); }
    try { const data = await makeDhanApiRequest('/v2/super/orders', 'POST', orderRequest); res.json(data);
    } catch (error) { res.status(500).json({ message: `Failed to place super order: ${error.message}` }); }
});
app.get('/api/super/orders', async (req, res) => {
    console.log('[ROUTE HIT] GET /api/super/orders - Fetching list of super orders');
    try { const data = await makeDhanApiRequest('/v2/super/orders', 'GET'); res.json(data);
    } catch (error) { console.error("Error in GET /api/super/orders:", error); res.status(500).json({ message: `Failed to get super orders list: ${error.message}` }); }
});
app.put('/api/super/orders/:orderId', async (req, res) => {
    const { orderId } = req.params; let modifyRequest = req.body;
    console.log(`Backend: Modify Super Order Leg for ${orderId}:`, modifyRequest);
    if (!DHAN_CLIENT_ID) { return res.status(500).json({ message: "DHAN_CLIENT_ID not configured." }); }
    modifyRequest.dhanClientId = DHAN_CLIENT_ID; 
    if (!modifyRequest.legName || !modifyRequest.orderType) { return res.status(400).json({ message: "Missing required parameters for modifying super order leg (legName, orderType)." }); }
    try { const data = await makeDhanApiRequest(`/v2/super/orders/${orderId}`, 'PUT', modifyRequest); res.json(data);
    } catch (error) { res.status(500).json({ message: `Failed to modify super order leg: ${error.message}` }); }
});
app.delete('/api/super/orders/:orderId/:legName', async (req, res) => {
    const { orderId, legName } = req.params; 
    console.log(`Backend: Cancel Super Order Leg for ${orderId}, leg ${legName}`);
    // Validate legName if necessary (e.g., ensure it's one of 'ENTRY_LEG', 'TARGET_LEG', 'STOP_LOSS_LEG')
    try { const data = await makeDhanApiRequest(`/v2/super/orders/${orderId}/${legName}`, 'DELETE'); res.json(data);
    } catch (error) { res.status(500).json({ message: `Failed to cancel super order leg: ${error.message}` }); }
});
