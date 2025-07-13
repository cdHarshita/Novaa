import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Play, Download, Share } from 'lucide-react';

interface HeaderProps {
  prompt: string;
}

const Header: React.FC<HeaderProps> = ({ prompt }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">WebCraft</span>
          </div>
          <div className="hidden md:block">
            <span className="text-sm text-gray-400">Building: </span>
            <span className="text-sm text-gray-200 max-w-md truncate">{prompt}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;