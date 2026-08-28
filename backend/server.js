require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');

const authRoutes = require('./routes/auth').router;
const submissionRoutes = require('./routes/submissions');
const teamRoutes = require('./routes/teams');
const participantRoutes = require('./routes/participants');
const analyticsRoutes = require('./routes/analytics');

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy header (Nginx, Cloudflare, VPS proxies)
app.set('trust proxy', 1);

// Rate limiter configuration
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX) || 2000, // limit each IP to 300 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests from this IP address, please try again in a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/dashboard/api/', apiLimiter);

// Ensure db directory exists
const dbDir = path.join(__dirname, './data/db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let mongoServer;

async function startServer() {
  try {
    const customUri = process.env.MONGODB_URI;
    let connectionUri = '';

    if (customUri) {
      try {
        console.log(`Attempting connection to MongoDB service at: ${customUri}`);
        await mongoose.connect(customUri, { serverSelectionTimeoutMS: 3000 });
        console.log('Mongoose connected successfully to configured MongoDB service.');
      } catch (err) {
        console.warn(`Could not connect to MONGODB_URI (${customUri}): ${err.message}`);
        console.log('Falling back to self-contained MongoDB Memory Server...');
        mongoServer = await MongoMemoryServer.create({
          instance: {
            dbPath: dbDir,
            storageEngine: 'wiredTiger'
          }
        });
        connectionUri = mongoServer.getUri();
        console.log(`Self-contained MongoDB started successfully at: ${connectionUri}`);
        await mongoose.connect(connectionUri);
        console.log('Mongoose connected to self-contained MongoDB.');
      }
    } else {
      console.log('Starting self-contained MongoDB Memory Server with local persistence...');
      // Create the memory server with persistent dbPath
      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbDir,
          storageEngine: 'wiredTiger'
        }
      });
      connectionUri = mongoServer.getUri();
      console.log(`Self-contained MongoDB started successfully at: ${connectionUri}`);
      await mongoose.connect(connectionUri);
      console.log('Mongoose connected to self-contained MongoDB.');
    }

    // Seed database with sample data
    const seedDatabase = require('./seed');
    await seedDatabase();

    // Register routes
    app.use('/dashboard/api/auth', authRoutes);
    app.use('/dashboard/api/submissions', submissionRoutes);
    app.use('/dashboard/api/teams', teamRoutes);
    app.use('/dashboard/api/participants', participantRoutes);
    app.use('/dashboard/api/analytics', analyticsRoutes);

    // Serve static assets in production under /dashboard
    const frontendDist = path.join(__dirname, '../frontend/dist');
    if (fs.existsSync(frontendDist)) {
      app.use('/dashboard', express.static(frontendDist));
      app.get('/dashboard/*', (req, res) => {
        res.sendFile(path.resolve(frontendDist, 'index.html'));
      });
      app.get('/dashboard', (req, res) => {
        res.sendFile(path.resolve(frontendDist, 'index.html'));
      });
      app.get('/', (req, res) => {
        res.redirect('/dashboard');
      });
      console.log('Serving frontend static files from production build under /dashboard.');
    } else {
      app.get('/', (req, res) => {
        res.redirect('/dashboard');
      });
      app.get('/dashboard', (req, res) => {
        res.send('AI Agent Expo API is running at /dashboard/api. Start the frontend developer server to view the portal.');
      });
    }

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
const cleanUp = async () => {
  console.log('Shutting down server...');
  if (mongoose.connection) {
    await mongoose.connection.close();
    console.log('Mongoose connection closed.');
  }
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped.');
  }
  process.exit(0);
};

process.on('SIGINT', cleanUp);
process.on('SIGTERM', cleanUp);
process.once('SIGUSR2', async () => {
  console.log('Nodemon restart signal (SIGUSR2) received. Cleaning up...');
  if (mongoose.connection) {
    await mongoose.connection.close();
    console.log('Mongoose connection closed.');
  }
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped.');
  }
  process.kill(process.pid, 'SIGUSR2');
});

startServer();
