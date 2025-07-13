import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Header from './Header';

const BuilderPage: React.FC = () => {
  const location = useLocation();
  const prompt = location.state?.prompt || 'Create a modern website';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header prompt={prompt} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar prompt={prompt} />
        <MainContent />
      </div>
    </div>
  );
};

export default BuilderPage;