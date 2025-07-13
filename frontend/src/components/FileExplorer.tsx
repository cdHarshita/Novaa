import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  FileCode, 
  Image, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Search,
  MoreVertical
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileNode[];
  size?: string;
  modified?: string;
}

const FileExplorer: React.FC = () => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['src', 'public']);
  const [selectedFile, setSelectedFile] = useState<string | null>('src/App.tsx');
  const [searchTerm, setSearchTerm] = useState('');

  const fileStructure: FileNode[] = [
    {
      name: 'public',
      type: 'folder',
      children: [
        { name: 'index.html', type: 'file', extension: 'html', size: '2.1 KB', modified: '2 min ago' },
        { name: 'favicon.ico', type: 'file', extension: 'ico', size: '1.2 KB', modified: '5 min ago' },
        { name: 'logo.svg', type: 'file', extension: 'svg', size: '3.4 KB', modified: '5 min ago' }
      ]
    },
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'Header.tsx', type: 'file', extension: 'tsx', size: '1.8 KB', modified: 'Just now' },
            { name: 'Navigation.tsx', type: 'file', extension: 'tsx', size: '2.3 KB', modified: '1 min ago' },
            { name: 'Footer.tsx', type: 'file', extension: 'tsx', size: '1.1 KB', modified: '3 min ago' }
          ]
        },
        {
          name: 'styles',
          type: 'folder',
          children: [
            { name: 'globals.css', type: 'file', extension: 'css', size: '4.2 KB', modified: '2 min ago' },
            { name: 'components.css', type: 'file', extension: 'css', size: '3.1 KB', modified: '4 min ago' }
          ]
        },
        {
          name: 'assets',
          type: 'folder',
          children: [
            { name: 'hero-bg.jpg', type: 'file', extension: 'jpg', size: '245 KB', modified: '6 min ago' },
            { name: 'logo.png', type: 'file', extension: 'png', size: '12 KB', modified: '6 min ago' }
          ]
        },
        { name: 'App.tsx', type: 'file', extension: 'tsx', size: '3.2 KB', modified: 'Just now' },
        { name: 'main.tsx', type: 'file', extension: 'tsx', size: '0.8 KB', modified: '5 min ago' },
        { name: 'index.css', type: 'file', extension: 'css', size: '1.2 KB', modified: '5 min ago' }
      ]
    },
    { name: 'package.json', type: 'file', extension: 'json', size: '1.4 KB', modified: '7 min ago' },
    { name: 'tsconfig.json', type: 'file', extension: 'json', size: '0.6 KB', modified: '7 min ago' },
    { name: 'tailwind.config.js', type: 'file', extension: 'js', size: '0.4 KB', modified: '7 min ago' },
    { name: 'README.md', type: 'file', extension: 'md', size: '2.1 KB', modified: '7 min ago' }
  ];

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return expandedFolders.includes(node.name) ? (
        <FolderOpen className="w-4 h-4 text-blue-400" />
      ) : (
        <Folder className="w-4 h-4 text-blue-400" />
      );
    }

    switch (node.extension) {
      case 'tsx':
      case 'ts':
      case 'jsx':
      case 'js':
        return <FileCode className="w-4 h-4 text-yellow-400" />;
      case 'css':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'html':
        return <FileCode className="w-4 h-4 text-orange-400" />;
      case 'json':
        return <FileCode className="w-4 h-4 text-green-400" />;
      case 'md':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'jpg':
      case 'png':
      case 'svg':
      case 'ico':
        return <Image className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderFileNode = (node: FileNode, path: string = '', depth: number = 0) => {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.includes(fullPath);
    const isSelected = selectedFile === fullPath;

    return (
      <div key={fullPath}>
        <div
          className={`flex items-center space-x-2 py-1.5 px-2 rounded cursor-pointer hover:bg-gray-700/50 transition-colors ${
            isSelected ? 'bg-purple-600/30 border-l-2 border-purple-400' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(fullPath);
            } else {
              setSelectedFile(fullPath);
              // Dispatch custom event to notify CodeEditor with more detail
              const event = new CustomEvent('fileSelected', {
                detail: { filePath: fullPath }
              });
              console.log('Dispatching file selection:', fullPath); // Debug log
              window.dispatchEvent(event);
            }
          }}
        >
          {node.type === 'folder' && (
            <div className="w-4 h-4">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </div>
          )}
          {getFileIcon(node)}
          <span className="text-sm text-gray-200 flex-1">{node.name}</span>
          {node.type === 'file' && (
            <span className="text-xs text-gray-500">{node.size}</span>
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, fullPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-900 flex flex-col">
      {/* File Explorer Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">File Explorer</h2>
          <div className="flex items-center space-x-2">
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {fileStructure.map(node => renderFileNode(node))}
      </div>

      {/* File Details Panel */}
      {selectedFile && (
        <div className="border-t border-gray-700 p-4 bg-gray-800/50">
          <h3 className="text-sm font-medium text-white mb-2">File Details</h3>
          <div className="space-y-1 text-xs text-gray-400">
            <div>Path: <span className="text-gray-300">{selectedFile}</span></div>
            <div>Last modified: <span className="text-gray-300">Just now</span></div>
            <div>Status: <span className="text-green-400">Saved</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;