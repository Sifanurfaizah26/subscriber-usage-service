const express = require('express');
const cors = require('cors');
const path = require('path');

const usageRoutes = require('./routes/usage');
const subscriberRoutes = require('./routes/subscribers');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve interactive frontend dashboard
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/usage', usageRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Subscriber Usage API',
    timestamp: new Date().toISOString()
  });
});

// JSON Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload provided.'
    });
  }
  return res.status(500).json({
    success: false,
    error: err.message || 'Internal server error.'
  });
});

// Export app for testing; start if executed directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(` 🚀 Subscriber Usage Service is Running!`);
    console.log(` 🌐 Web Dashboard: http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
    console.log(` 📡 API Base:      http://127.0.0.1:${PORT}/api/usage`);
    console.log(` 🩺 Health Check:  http://127.0.0.1:${PORT}/api/health`);
    console.log(`===================================================`);
  });
}

module.exports = app;
