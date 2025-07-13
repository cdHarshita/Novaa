import React, { useState } from 'react';
import StepsPanel from './StepsPanel';
import FileExplorer from './FileExplorer';
import { FileCode, List } from 'lucide-react';

interface SidebarProps {
  prompt: string;
}

const Sidebar: React.FC<SidebarProps> = ({ prompt }) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'files'>('steps');

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('steps')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'steps'
              ? 'bg-gray-700 text-white border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Steps</span>
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'files'
              ? 'bg-gray-700 text-white border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Files</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'steps' ? (
          <StepsPanel prompt={prompt} />
        ) : (
          <FileExplorer />
        )}
      </div>
    </div>
  );
};

export default Sidebar;