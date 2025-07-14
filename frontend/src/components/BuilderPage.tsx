import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from './config';
import axios from 'axios';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Header from './Header';
import { parseXml } from './steps';
import { Step, FileItem, StepType } from '../types';

const BuilderPage: React.FC = () => {
  const location = useLocation();
  const prompt = location.state?.prompt || 'Create a modern website';
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const processFileStep = (step: Step, existingFiles: FileItem[]): FileItem[] => {
    if (step.type !== StepType.CreateFile || !step.path || !step.code) {
      return existingFiles;
    }

    const newFiles = [...existingFiles];
    const filePath = step.path;
    const fileName = filePath.split('/').pop() || '';

    // Create folder structure first
    const pathParts = filePath.split('/');
    pathParts.pop(); // Remove filename
    let currentPath = '';
    
    pathParts.forEach(folder => {
      currentPath = currentPath ? `${currentPath}/${folder}` : folder;
      const folderExists = newFiles.some(f => f.path === currentPath && f.type === 'folder');
      
      if (!folderExists) {
        newFiles.push({
          path: currentPath,
          name: folder,
          type: 'folder',
          children: []
        });
      }
    });

    // Create or update file
    const newFile: FileItem = {
      path: filePath,
      name: fileName,
      type: 'file',
      content: step.code
    };

    const fileIndex = newFiles.findIndex(f => f.path === filePath);
    if (fileIndex >= 0) {
      newFiles[fileIndex] = newFile;
    } else {
      newFiles.push(newFile);
    }

    return newFiles;
  };

  const init = useCallback(async () => {
    if (isInitialized) return;

    try {
      console.log('Starting initialization...');
      
      // Step 1: Get template response
      const templateResponse = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim()
      });
      
      const {prompts, uiPrompts} = templateResponse.data;
      
      // Validate template response
      if (!uiPrompts || !Array.isArray(uiPrompts) || uiPrompts.length === 0) {
        console.error('Invalid template response:', templateResponse.data);
        return;
      }

      // Parse template steps
      let templateSteps: Step[] = [];
      try {
        templateSteps = parseXml(uiPrompts[0]).map((x: Step, index: number) => ({
          ...x,
          id: index + 1,
          status: "pending" as const
        }));
        
        setSteps(templateSteps);
        
        // Process template files
        let updatedFiles: FileItem[] = [];
        templateSteps.forEach(step => {
          updatedFiles = processFileStep(step, updatedFiles);
        });
        setFiles(updatedFiles);
        
        console.log('Template steps processed:', templateSteps.length);
      } catch (parseError) {
        console.error('Error parsing template XML:', parseError);
        return;
      }

      // Step 2: Get chat response
      console.log('Getting chat steps...');
      const chatResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...prompts, prompt].map((msg: string) => ({ role: 'user', content: msg })),
      });

      // Validate chat response
      if (!chatResponse.data || !chatResponse.data.response) {
        console.error('Invalid chat response:', chatResponse.data);
        return;
      }

      console.log('Chat response received:', chatResponse.data.response);

      // Process chat steps
      let chatSteps: Step[] = [];
      try {
        chatSteps = parseXml(chatResponse.data.response);
        console.log('Parsed chat steps:', chatSteps);
      } catch (parseError) {
        console.error('Error parsing chat response XML:', parseError);
        console.log('XML content that failed:', chatResponse.data.response);
        return;
      }

      const maxTemplateId = Math.max(...templateSteps.map(s => s.id));

      if (chatSteps.length > 0) {
        // Update files from chat steps all at once
        setFiles(prevFiles => {
          let newFiles = [...prevFiles];
          chatSteps.forEach(step => {
            newFiles = processFileStep(step, newFiles);
          });
          return newFiles;
        });

        // Add chat steps
        setSteps(prevSteps => [
          ...prevSteps,
          ...chatSteps.map((x, index) => ({
            ...x,
            id: maxTemplateId + index + 1,
            status: "pending" as const
          }))
        ]);
      }

      console.log('Chat steps processed:', chatSteps.length);

      // Select first file if none selected
      setFiles(prevFiles => {
        const fileItems = prevFiles.filter(f => f.type === 'file');
        if (fileItems.length > 0 && !selectedFile) {
          setSelectedFile(fileItems[0].path);
        }
        return prevFiles;
      });

      setIsInitialized(true);
      console.log('Initialization complete');
    } catch (error) {
      console.error('Error in init:', error);
    }
  }, [prompt, isInitialized]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const pendingSteps = steps.filter(({status}) => status === "pending");
    if (pendingSteps.length === 0) return;

    // Create a deep copy of current files
    const updatedFiles = [...files];

    pendingSteps.forEach(step => {
      // Handle file creation steps that have code
      if (step.type === StepType.CreateFile && step.path && step.code) {
        const pathParts = step.path.split("/");
        const fileName = pathParts.pop() || "";
        let currentPath = "";
        let currentLevel = updatedFiles;

        // Create folders in the path if they don't exist
        for (const folder of pathParts) {
          currentPath = currentPath ? `${currentPath}/${folder}` : folder;
          let folderNode = currentLevel.find(f => f.path === currentPath && f.type === 'folder');
          
          if (!folderNode) {
            folderNode = {
              name: folder,
              type: 'folder',
              path: currentPath,
              children: []
            };
            currentLevel.push(folderNode);
          }
          currentLevel = folderNode.children || [];
        }

        // Add or update the file
        const filePath = step.path;
        const existingFileIndex = currentLevel.findIndex(f => f.path === filePath);
        const newFile = {
          name: fileName,
          type: 'file' as const,
          path: filePath,
          content: step.code
        };

        if (existingFileIndex >= 0) {
          currentLevel[existingFileIndex] = newFile;
        } else {
          currentLevel.push(newFile);
        }
      }
    });

    // Update files state
    setFiles(updatedFiles);

    // Mark steps as completed
    setSteps(prevSteps => 
      prevSteps.map(s => ({
        ...s,
        status: s.status === "pending" ? "completed" as const : s.status
      }))
    );
  }, [steps, files]);
   
  useEffect(() => {
    // Initialize the first step as current when steps are loaded
    if (steps.length > 0 && !currentStep) {
      const firstStep = steps.find(step => step.status === 'pending');
      if (firstStep) {
        setSteps(prevSteps => prevSteps.map(step => ({
          ...step,
          status: step.id === firstStep.id ? "current" : step.status
        })));
        setCurrentStep(firstStep);
      }
    }
  }, [steps, currentStep]);

  // Handle step transition when current step is completed
  useEffect(() => {
    if (!currentStep) return;

    const processCurrentStep = async () => {
      try {
        // Update files if needed
        if (currentStep.type === StepType.CreateFile) {
          setFiles(prevFiles => processFileStep(currentStep, prevFiles));
        }
        
        // Mark step as completed and update next step
        setSteps(prevSteps => {
          const updatedSteps = prevSteps.map(step => {
            if (step.id === currentStep.id) {
              return { ...step, status: "completed" as const };
            }
            // Find next uncompleted step and mark it as current
            if (step.id === currentStep.id + 1 && step.status === "pending") {
              return { ...step, status: "current" as const };
            }
            return step;
          });
          
          // Find the new current step
          const nextStep = updatedSteps.find(step => step.status === "current");
          if (nextStep) {
            setCurrentStep(nextStep);
          }
          
          return updatedSteps;
        });
        
        // Select current step's file if it exists
        if (currentStep.type === StepType.CreateFile && currentStep.path) {
          setSelectedFile(currentStep.path);
        }
      } catch (error) {
        console.error('Error processing current step:', error);
      }
    };

    processCurrentStep();
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header prompt={prompt} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar prompt={prompt} steps={steps} files={files} onFileSelect={setSelectedFile} />
        <MainContent selectedFile={selectedFile} files={files} />
      </div>
    </div>
  );
};

export default BuilderPage;