import React from 'react';
import BewirtungsbelegForm from './components/BewirtungsbelegForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <BewirtungsbelegForm />
      </div>
    </main>
  );
} 