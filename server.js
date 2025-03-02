const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// API key from environment variables for security
const API_KEY = process.env.API_KEY || '';

// Proxy endpoint for 511.org API
app.get('/api/transit', async (req, res) => {
  try {
    const { stopCode, agency, line } = req.query;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured on server' 
      });
    }
    
    if (!stopCode || !agency) {
      return res.status(400).json({ 
        error: 'Missing required parameters: stopCode and agency' 
      });
    }
    
    const url = `https://api.511.org/transit/StopMonitoring?api_key=${API_KEY}&stopCode=${stopCode}&agency=${agency}`;
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/xml'
      }
    });
    
    res.set('Content-Type', 'application/xml');
    res.send(response.data);
    
  } catch (error) {
    console.error('API request error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 