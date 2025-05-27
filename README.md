 # RAG-PDF Project

## Environment Variables Setup

This project requires environment variables to be set up in two locations:

### Frontend Environment Variables
Location: `frontend/.env`
```
REACT_APP_API_URL=your_api_url
// Add other frontend environment variables here
```

### Backend Environment Variables
Location: `backend/src/config/index.ts`
```typescript
export const config = {
PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ,
  
  OPENAI_API_KEY: process.env.OPENAI_API_KEY 
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  
  QDRANT_URL: process.env.QDRANT_URL 
  QDRANT_COLLECTION: process.env.QDRANT_COLLECTION 
  QDRANT_API_KEY: process.env.QDRANT_API_KEY 
  
  REDIS_URL: process.env.REDIS_URL
  
  UPLOAD_DIR: process.env.UPLOAD_DIR };
```

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` in the frontend directory
3. Set up your configuration in `backend/src/config/index.ts`
4. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

## Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

## Important Notes

- Never commit environment files (.env) or configuration files containing sensitive information
- Make sure to update both frontend and backend environment variables according to your setup
- Check the .gitignore file to ensure sensitive files are not tracked

## License

[Add your license information here]# Environment variables
.env
frontend/.env
backend/src/config/index.ts

# Dependencies
node_modules/
**/node_modules/

# Build outputs
dist/
build/
*.log

# IDE specific files
.vscode/
.idea/
*.swp
*.swo

# OS specific files
.DS_Store
Thumbs.db