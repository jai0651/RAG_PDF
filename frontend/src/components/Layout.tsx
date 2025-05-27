import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with nice gradient background */}
      <header className="sticky top-0 z-50 px-4 lg:px-6 h-16 flex items-center border-b bg-blue-600 dark:bg-gray-900 text-white shadow-md">
        <Link to="/" className="flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-6 w-6 mr-2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
          <span className="text-2xl font-bold">PDF Chat</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/chat')}
            className="text-white hover:bg-blue-700 dark:hover:bg-gray-800"
          >
            Chat
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/upload')}
            className="text-white hover:bg-blue-700 dark:hover:bg-gray-800"
          >
            Upload
          </Button>
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 bg-white dark:bg-gray-900 dark:text-gray-400 shadow-inner">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} PDF Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 