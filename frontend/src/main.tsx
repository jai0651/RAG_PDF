import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';

// Get Clerk publishable key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if key exists
if (!clerkPublishableKey) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
  // Add a visible error message in the DOM
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: sans-serif; text-align: center;">
      <h1>Configuration Error</h1>
      <p>Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.</p>
      <p>Please make sure your .env file contains VITE_CLERK_PUBLISHABLE_KEY.</p>
    </div>
  `;
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

console.log('Clerk Key:', clerkPublishableKey); // Debug log

const ClerkProviderComponent = ClerkProvider as React.ComponentType<{
  publishableKey: string;
  children: React.ReactNode;
}>;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <ClerkProviderComponent publishableKey={clerkPublishableKey}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProviderComponent>
    </ThemeProvider>
  </React.StrictMode>,
); 