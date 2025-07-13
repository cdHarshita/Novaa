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
import { FileItem } from '../types';

const FileExplorer: React.FC = () => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['src', 'public']);
  const [selectedFile, setSelectedFile] = useState<string | null>('src/App.tsx');
  const [searchTerm, setSearchTerm] = useState('');

  // Updated fileStructure to use 'path' and remove extra fields
  const fileStructure: FileItem[] = [
    {
      name: 'public',
      type: 'folder',
      path: 'public',
      children: [
        { name: 'index.html', type: 'file', path: 'public/index.html' },
        { name: 'favicon.ico', type: 'file', path: 'public/favicon.ico' },
        { name: 'logo.svg', type: 'file', path: 'public/logo.svg' }
      ]
    },
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'folder',
          path: 'src/components',
          children: [
            { name: 'Header.tsx', type: 'file', path: 'src/components/Header.tsx' },
            { name: 'Navigation.tsx', type: 'file', path: 'src/components/Navigation.tsx' },
            { name: 'Footer.tsx', type: 'file', path: 'src/components/Footer.tsx' }
          ]
        },
        {
          name: 'styles',
          type: 'folder',
          path: 'src/styles',
          children: [
            { name: 'globals.css', type: 'file', path: 'src/styles/globals.css' },
            { name: 'components.css', type: 'file', path: 'src/styles/components.css' }
          ]
        },
        {
          name: 'assets',
          type: 'folder',
          path: 'src/assets',
          children: [
            { name: 'hero-bg.jpg', type: 'file', path: 'src/assets/hero-bg.jpg' },
            { name: 'logo.png', type: 'file', path: 'src/assets/logo.png' }
          ]
        },
        { name: 'App.tsx', type: 'file', path: 'src/App.tsx' },
        { name: 'main.tsx', type: 'file', path: 'src/main.tsx' },
        { name: 'index.css', type: 'file', path: 'src/index.css' }
      ]
    },
    { name: 'package.json', type: 'file', path: 'package.json' },
    { name: 'tsconfig.json', type: 'file', path: 'tsconfig.json' },
    { name: 'tailwind.config.js', type: 'file', path: 'tailwind.config.js' },
    { name: 'README.md', type: 'file', path: 'README.md' }
  ];

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const getFileIcon = (node: FileItem) => {
    if (node.type === 'folder') {
      return expandedFolders.includes(node.path) ? (
        <FolderOpen className="w-4 h-4 text-blue-400" />
      ) : (
        <Folder className="w-4 h-4 text-blue-400" />
      );
    }

    const ext = node.name.split('.').pop();
    switch (ext) {
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

  const renderFileItem = (node: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.includes(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center space-x-2 py-1.5 px-2 rounded cursor-pointer hover:bg-gray-700/50 transition-colors ${
            isSelected ? 'bg-purple-600/30 border-l-2 border-purple-400' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              setSelectedFile(node.path);
              const event = new CustomEvent('fileSelected', {
                detail: { filePath: node.path }
              });
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
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileItem(child, depth + 1))}
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
        {fileStructure.map(node => renderFileItem(node))}
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
