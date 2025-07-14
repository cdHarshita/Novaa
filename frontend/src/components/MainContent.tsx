import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import PreviewPanel from './PreviewPanel';
import { Code, Eye } from 'lucide-react';
import { FileItem } from '../types';

interface MainContentProps {
  selectedFile: string | null;
  files: FileItem[];
}

const MainContent: React.FC<MainContentProps> = ({ selectedFile, files }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  // Find the selected file's content
  const selectedFileContent = selectedFile 
    ? files.find(f => f.path === selectedFile)?.content || ''
    : '';

  return (
    <div className="flex-1 bg-gray-900 flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-6 py-3 text-sm font-medium flex items-center space-x-2 transition-colors ${
            activeTab === 'code'
              ? 'bg-gray-900 text-white border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Code</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-6 py-3 text-sm font-medium flex items-center space-x-2 transition-colors ${
            activeTab === 'preview'
              ? 'bg-gray-900 text-white border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' ? (
        <CodeEditor selectedFile={selectedFile} files={files} />
      ) : (
        <PreviewPanel />
      )}
      </div>
    </div>
  );
};

export default MainContent;