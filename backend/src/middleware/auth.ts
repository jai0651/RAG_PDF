import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config';

// Extend the Express Request type to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

// Initialize JWKS client to fetch Clerk's public keys
const client = jwksClient({
  jwksUri: 'https://arriving-possum-81.clerk.accounts.dev/.well-known/jwks.json',
  cache: true,
  rateLimit: true,
});

// Function to get the signing key
const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void => {
  if (!header.kid) return callback(new Error('No KID in token header'));
  
  client.getSigningKey(header.kid, (err: Error | null, key: jwksClient.SigningKey | undefined) => {
    if (err) return callback(err);
    
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    // Skip auth for health check endpoint
    if (req.path === '/api/health') {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token using Clerk's JWKS
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
      
      const decodedToken = decoded as jwt.JwtPayload;
      
      // Get the user and session IDs
      const userId = decodedToken.sub;
      const sessionId = decodedToken.sid || '';

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user' });
      }

      // Store the user ID in the request
      req.auth = {
        userId,
        sessionId
      };

      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}