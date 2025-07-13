import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileCode, Save, Copy, Download } from 'lucide-react';

const CodeEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState('src/App.tsx');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [isLoading, setIsLoading] = useState(false);

  // Sample file contents
  const fileContents: Record<string, { content: string; language: string }> = {
    'src/App.tsx': {
      content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import BuilderPage from './components/BuilderPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/builder" element={<BuilderPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,
      language: 'typescript'
    },
    'src/components/Header.tsx': {
      content: `import React from 'react';
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
        </div>
      </div>
    </header>
  );
};

export default Header;`,
      language: 'typescript'
    },
    'src/index.css': {
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Smooth transitions */
* {
  transition: color 0.2s ease, background-color 0.2s ease;
}`,
      language: 'css'
    },
    'package.json': {
      content: `{
  "name": "website-builder",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.6.3",
    "@monaco-editor/react": "^4.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}`,
      language: 'json'
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const fileData = fileContents[selectedFile];
    if (fileData) {
      setCode(fileData.content);
      setLanguage(fileData.language);
    } else {
      // Handle files not in our sample data
      setCode(`// File: ${selectedFile}\n// Content not available in demo`);
      const ext = selectedFile.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'tsx':
        case 'ts':
          setLanguage('typescript');
          break;
        case 'jsx':
        case 'js':
          setLanguage('javascript');
          break;
        case 'css':
          setLanguage('css');
          break;
        case 'html':
          setLanguage('html');
          break;
        case 'json':
          setLanguage('json');
          break;
        case 'md':
          setLanguage('markdown');
          break;
        default:
          setLanguage('plaintext');
      }
    }
    setIsLoading(false);
  }, [selectedFile]);

  // Listen for file selection from FileExplorer
  useEffect(() => {
    const handleFileSelect = (event: any) => {
      const filePath = event.detail.filePath;
      console.log('File selected:', filePath); // Debug log
      setSelectedFile(filePath);
    };

    window.addEventListener('fileSelected', handleFileSelect);
    return () => {
      window.removeEventListener('fileSelected', handleFileSelect);
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  const saveFile = () => {
    // In a real implementation, this would save to the backend
    console.log('Saving file:', selectedFile);
  };

  const downloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <FileCode className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium text-white">{selectedFile}</span>
          {isLoading && <span className="text-xs text-blue-400">Loading...</span>}
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {language}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={downloadFile}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={saveFile}
            className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
            title="Save file"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: true },
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            suggest: {
              showKeywords: true,
              showSnippets: true
            },
            // Disable error squiggles and validation
            'semanticHighlighting.enabled': false,
            quickSuggestions: false,
            parameterHints: { enabled: false },
            hover: { enabled: false },
            occurrencesHighlight: "off",
            selectionHighlight: false,
            wordBasedSuggestions: "off",
            codeLens: false,
            folding: false,
            links: false,
            colorDecorators: false
          }}
          beforeMount={(monaco) => {
            // Disable all diagnostics to remove red underlines
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true,
              noSuggestionDiagnostics: true
            });
            
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true,
              noSuggestionDiagnostics: true
            });
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          <span className="text-green-400">● Saved</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>UTF-8</span>
          <span>LF</span>
          <span className="capitalize">{language}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;