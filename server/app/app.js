'use strict';

// Instant of Server
function runServer() {
  // ===== Express =====
  const express = require('express');
  const app = express();

  // ===== Require Packages ======
  const path = require('path');
  const bodyParser = require('body-parser');
  const cors = require('cors');
  // ===== Config =====
  const env = process.env.NODE_ENV || 'development';
  const config = require('../config')[env];

  // ===== Initial processes
  require('./functions/initEnv')();

  // ===== Middleware =====
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cors());

  // ===== API =====
  app.use('/api', require('./routes/api'));
  app.use('/upload', require('./routes/upload'));
  // ===== Front End =====
  app.use('/', express.static(path.join(__dirname, '../dist/')));
  // Send all other requests to the Angular app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

  // =====  Port =====
  const port = config.port;
  const server = app.listen(port, () => {
    console.log(`Web server listening on: ${port}`);
    server.emit('started');
  });
  server.stop = () => {
    server.close(() => {
      console.log('Web Server Closed!');
      server.emit('end');
    });
  }
  return server;
}

module.exports = runServer;
