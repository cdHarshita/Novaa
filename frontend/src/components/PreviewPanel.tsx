import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Tablet, Monitor, Maximize } from 'lucide-react';

const PreviewPanel: React.FC = () => {
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getViewportStyles = () => {
    switch (viewportSize) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  // Sample preview content - in a real app, this would be the actual website preview
  const PreviewContent = () => (
    <div className="min-h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome to Your
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Website</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            This is a live preview of your website. Changes you make in the code editor will be reflected here.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
                <div className="w-12 h-12 bg-purple-600 rounded-lg mb-4 mx-auto"></div>
                <h3 className="text-lg font-semibold text-white mb-2">Feature {i}</h3>
                <p className="text-gray-400">Description of feature {i} goes here.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewportSize('mobile')}
              className={`p-2 rounded transition-colors ${
                viewportSize === 'mobile' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewportSize('tablet')}
              className={`p-2 rounded transition-colors ${
                viewportSize === 'tablet' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Tablet view"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewportSize('desktop')}
              className={`p-2 rounded transition-colors ${
                viewportSize === 'desktop' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-gray-400">
            {viewportSize === 'mobile' && '375 × 667'}
            {viewportSize === 'tablet' && '768 × 1024'}
            {viewportSize === 'desktop' && 'Responsive'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className={`p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <div
            className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
            style={getViewportStyles()}
          >
            <div className="w-full h-full overflow-auto">
              <PreviewContent />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Status */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="text-green-400">● Live Preview</span>
          <span>Last updated: Just now</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="capitalize">{viewportSize} view</span>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;