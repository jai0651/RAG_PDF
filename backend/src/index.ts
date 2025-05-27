import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from './middleware/auth';

// Import routers
import { pdfUploadRouter } from './routes/upload';
import { chatRouter } from './routes/chat';

// Import services
import { initializeQdrantCollection } from './services/qdrant';

// Initialize services
async function initializeServices(): Promise<void> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = config.UPLOAD_DIR;
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created uploads directory: ${uploadsDir}`);
    }

    // Initialize Qdrant collection
    await initializeQdrantCollection();
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
  }
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Auth middleware for all routes
app.use(authMiddleware);

// Routes
app.use('/api/upload', pdfUploadRouter);
app.use('/api/chat', chatRouter);
app.use('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Start the server
const port = config.PORT || 3001;

// Initialize services and then start the server
initializeServices().then(() => {
  app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 