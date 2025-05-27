import React, { ReactNode } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp, SignedOut, useAuth } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import { Layout } from './components/Layout';
import { Toaster } from './components/ui/toaster';

// Protected route component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/sign-in/*"
          element={
            <SignedOut>
              <div className="flex justify-center items-center min-h-screen">
                <SignIn routing="path" path="/sign-in" redirectUrl="/chat" />
              </div>
            </SignedOut>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <SignedOut>
              <div className="flex justify-center items-center min-h-screen">
                <SignUp routing="path" path="/sign-up" redirectUrl="/chat" />
              </div>
            </SignedOut>
          }
        />

        {/* Protected routes with Layout */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <UploadPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App; 