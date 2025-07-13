import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Step } from '.././types'; // Assuming you have a types file for Step interface


interface StepsPanelProps {
  prompt: string;
  steps: Step[];
}

const StepsPanel: React.FC<StepsPanelProps> = ({ prompt, steps }) => {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1]);


  const toggleStep = (stepId: number) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const getStatusIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Build Progress</h2>
        <p className="text-sm text-gray-400 mt-1">Follow these steps to create your website</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="bg-gray-900 rounded-lg border border-gray-700">
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full p-4 text-left flex items-center space-x-3 hover:bg-gray-700/50 transition-colors rounded-lg"
            >
              {getStatusIcon(step.status)}
              <div className="flex-1">
                <h3 className="font-medium text-white">{step.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{step.description}</p>
              </div>
              {expandedSteps.includes(step.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {expandedSteps.includes(step.id) && step.substeps && (
              <div className="px-4 pb-4">
                <div className="ml-8 space-y-2">
                  {step.substeps.map((substep, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-300">{substep}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="text-sm text-gray-400">
          <span className="text-green-400">1</span> completed • 
          <span className="text-blue-400 ml-1">1</span> in progress • 
          <span className="text-gray-500 ml-1">4</span> pending
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full" style={{width: '20%'}}></div>
        </div>
      </div>
    </div>
  );
};

export default StepsPanel;