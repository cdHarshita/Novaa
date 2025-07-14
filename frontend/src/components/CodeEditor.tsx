import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileCode, Save, Copy, Download } from 'lucide-react';
import { FileItem } from '../types';

interface CodeEditorProps {
  selectedFile: string | null;
  files: FileItem[];
}

const CodeEditor: React.FC<CodeEditorProps> = ({ selectedFile, files }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setCode('// Select a file to view its contents');
      setLanguage('plaintext');
      return;
    }

    setIsLoading(true);
    const fileData = files.find(f => f.path === selectedFile);
    if (fileData) {
      setCode(fileData.content || '');
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
    } else {
      setCode(`// File: ${selectedFile}\n// Content not available`);
      setLanguage('plaintext');
    }
    setIsLoading(false);
  }, [selectedFile, files]);

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
    if (!selectedFile) return;
    
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
          <span className="text-sm font-medium text-white">{selectedFile || 'No file selected'}</span>
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
            disabled={!selectedFile}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={saveFile}
            className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
            title="Save file"
            disabled={!selectedFile}
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