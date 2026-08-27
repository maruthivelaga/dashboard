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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
      connectionUri = customUri;
      console.log(`Connecting to MongoDB service at: ${connectionUri}`);
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
    }

    await mongoose.connect(connectionUri);
    console.log('Mongoose connected to MongoDB.');

    // Seed database with sample data
    const seedDatabase = require('./seed');
    await seedDatabase();

    // Register routes
    app.use('/api/auth', authRoutes);
    app.use('/api/submissions', submissionRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api/participants', participantRoutes);
    app.use('/api/analytics', analyticsRoutes);

    // Serve static assets in production
    // If the frontend is built, serve it from frontend/dist
    const frontendDist = path.join(__dirname, '../frontend/dist');
    if (fs.existsSync(frontendDist)) {
      app.use(express.static(frontendDist));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(frontendDist, 'index.html'));
      });
      console.log('Serving frontend static files from production build.');
    } else {
      app.get('/', (req, res) => {
        res.send('AI Agent Expo API is running. Start the frontend developer server to view the portal.');
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
