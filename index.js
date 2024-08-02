const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQL Server configuration
const dbConfig = {
  user: 'FentOps',
  password: 'BBLDrizzyOnMyN1zz1e$',
  server: 'qrify.database.windows.net', 
  database: 'QRify History',
  options: {
    encrypt: true, // Use this if you're on Windows Azure
    trustServerCertificate: false, // Change to true for local dev / self-signed certs
  },
};

// Function to connect to the database
async function connectToDatabase() {
  try {
    await sql.connect(dbConfig);
    console.log('Connected to the SQL database successfully!');
  } catch (err) {
    console.error('Failed to connect to the SQL database:', err);
  }
}

// Initial connection check at server startup
connectToDatabase();

// Endpoint to create an account
app.post('/createAccount', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Attempting to connect to the database...');
    await sql.connect(dbConfig);
    console.log('Connected to the database.');

    // Check if the username already exists
    const checkUser = await sql.query`SELECT * FROM Logins WHERE username = ${username}`;
    if (checkUser.recordset.length > 0) {
      res.status(400).json({ success: false, message: 'Username already exists.' });
      return;
    }

    // Insert the new user into the database
    await sql.query`INSERT INTO Logins (username, password) VALUES (${username}, ${password})`;

    res.json({ success: true });
  } catch (err) {
    console.error('Error in /createAccount:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Endpoint to sign in
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Attempting to connect to the database...');
    await sql.connect(dbConfig);
    console.log('Connected to the database.');

    // Check if the username and password match
    const checkUser = await sql.query`SELECT uid FROM Logins WHERE username = ${username} AND password = ${password}`;
    if (checkUser.recordset.length > 0) {
      res.json({ success: true, uid: checkUser.recordset[0].uid, message: 'Sign-in successful.' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid username or password.' });
    }
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Endpoint to store scan history
app.post('/storeScan', async (req, res) => {
  const { uid, scanData, scanDate } = req.body;

  try {
    console.log('Attempting to connect to the database...');
    await sql.connect(dbConfig);
    console.log('Connected to the database.');

    // Insert scan data into the ScanHistory table
    await sql.query`INSERT INTO ScanHistory (uid, scanData, scanDate) VALUES (${uid}, ${scanData}, ${scanDate})`;

    res.json({ success: true });
  } catch (err) {
    console.error('Error in /storeScan:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Route to get scan history
app.get('/ScanHistory', async (req, res) => {
  const { uid } = req.query;

  try {
      const request = new sql.Request();
      const query = `SELECT ScanData, ScanDate FROM ScanHistory WHERE Uid = @Uid ORDER BY ScanDate DESC`;
      request.input('Uid', sql.VarChar, uid);
      const result = await request.query(query);
      res.status(200).json(result.recordset);
  } catch (err) {
      console.error('Error fetching scan history:', err);
      res.status(500).send({ error: 'Failed to fetch scan history' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
