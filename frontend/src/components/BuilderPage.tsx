import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const initializationRef = useRef({ started: false, completed: false });

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
    // Check if initialization has already started or completed
    if (initializationRef.current.started || initializationRef.current.completed || isInitialized) {
      return;
    }
    
    // Mark initialization as started
    initializationRef.current.started = true;

    try {
      console.log('Starting initialization...');
      
      // Step 1: Get template response
      const templateResponse = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim()
      });
      
      console.log('Template response data:', templateResponse.data);
      
      const {prompts, uiPrompts} = templateResponse.data;
      
      // Log and validate template response data
      console.log('Extracted prompts:', prompts);
      console.log('Extracted uiPrompts:', uiPrompts);
      
      // Validate template response
      if (!uiPrompts || !Array.isArray(uiPrompts) || uiPrompts.length === 0) {
        console.error('Invalid template response:', templateResponse.data);
        return;
      }
      
      if (!prompts || !Array.isArray(prompts)) {
        console.error('Invalid prompts in template response:', prompts);
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
      
      // Log raw prompts data
      console.log('Raw prompts from template:', prompts);

      // Validate prompts before sending
      if (!Array.isArray(prompts)) {
        console.error('Invalid prompts array:', prompts);
        return;
      }

      if (prompts.length === 0) {
        console.error('Empty prompts array from template response');
        return;
      }

      // Construct messages array carefully
      const messages = prompts.map((content, index) => {
        console.log(`Processing prompt ${index}:`, content);
        return {
          role: "user" as const,
          content: typeof content === 'string' ? content : JSON.stringify(content)
        };
      });

      // Add the final prompt
      console.log('Adding final prompt:', prompt);
      messages.push({
        role: "user" as const,
        content: prompt
      });

      console.log('Final messages array:', JSON.stringify(messages, null, 2));

      // Log the exact request we're about to send
      const requestBody = { messages };
      console.log('Sending chat request to:', `${BACKEND_URL}/chat`);
      console.log('With request body:', JSON.stringify(requestBody, null, 2));
      
      let chatResponseData: { response?: string } = {};
      
      try {
        const chatResponse = await axios.post(`${BACKEND_URL}/chat`, {
          messages
        });
        console.log('Raw chat response:', chatResponse.data);

        chatResponseData = chatResponse.data;

        // Validate chat response
        if (!chatResponseData) {
          console.error('Empty chat response');
          return;
        }

        if (!chatResponseData.response) {
          console.error('Chat response missing "response" field:', chatResponseData);
          return;
        }

        if (typeof chatResponseData.response !== 'string') {
          console.error('Chat response is not a string:', chatResponseData.response);
          return;
        }
      } catch (error) {
        const chatError = error as Error & { 
          response?: { 
            data: unknown 
          } 
        };
        console.error('Error making chat request:', chatError.message);
        if (chatError.response) {
          console.error('Chat error response:', chatError.response.data);
        }
        return;
      }

      console.log('Chat response received:', chatResponseData.response);

      // Process chat steps
      let chatSteps: Step[] = [];
      try {
        chatSteps = parseXml(chatResponseData.response);
        console.log('Parsed chat steps:', chatSteps);
      } catch (parseError) {
        console.error('Error parsing chat response XML:', parseError);
        console.log('XML content that failed:', chatResponseData.response);
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

      initializationRef.current.completed = true;
      setIsInitialized(true);
      console.log('Initialization complete');
    } catch (error) {
      console.error('Error in init:', error);
      // Reset initialization status on error
      initializationRef.current.started = false;
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