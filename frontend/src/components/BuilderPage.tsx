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
      //console.log('[BuilderPage] Invalid file step:', { step });
      return existingFiles;
    }

    console.log('[BuilderPage] Processing file step:', {
      path: step.path,
      codeLength: step.code.length,
      timestamp: new Date().toISOString()
    });

    const newFiles = [...existingFiles];
    const filePath = step.path;
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // First check if this file exists at any level in the tree
    const findAndUpdateFile = (files: FileItem[], targetPath: string): boolean => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].path === targetPath) {
          // Update existing file with safety check
          const updatedContent = step.code?.trim() || '';
          files[i] = {
            ...files[i],
            content: updatedContent,
            type: 'file'
          };
          console.log('[BuilderPage] Updated existing file:', targetPath);
          return true;
        }
        if (files[i].type === 'folder' && files[i].children) {
          const children = files[i].children;
          if (Array.isArray(children) && findAndUpdateFile(children, targetPath)) {
            return true;
          }
        }
      }
      return false;
    };

    // Try to update existing file first
    if (findAndUpdateFile(newFiles, filePath)) {
      return newFiles;
    }

    // If file doesn't exist, create it with its directory structure
    let currentFiles = newFiles;
    let currentPath = '';

    // Handle root-level files
    if (pathParts.length === 1) {
      const existingFileIndex = newFiles.findIndex(f => f.path === filePath);
      const rootFile: FileItem = {
        path: filePath,
        name: fileName,
        type: 'file',
        content: step.code.trim()
      };
      
      if (existingFileIndex >= 0) {
        newFiles[existingFileIndex] = rootFile;
        console.log('[BuilderPage] Updated root file:', filePath);
      } else {
        newFiles.push(rootFile);
        console.log('[BuilderPage] Created new root file:', filePath);
      }
      return newFiles;
    }

    // Process directories
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folder = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${folder}` : folder;
      
      let folderNode = currentFiles.find(f => f.path === currentPath && f.type === 'folder');
      
      if (!folderNode) {
        folderNode = {
          path: currentPath,
          name: folder,
          type: 'folder',
          children: []
        };
        currentFiles.push(folderNode);
        console.log('[BuilderPage] Created new directory:', currentPath);
      }

      // Ensure children array exists
      if (!Array.isArray(folderNode.children)) {
        folderNode.children = [];
      }
      currentFiles = folderNode.children;
    }

    // Create file in the final directory
    const fileNode: FileItem = {
      path: filePath,
      name: fileName,
      type: 'file',
      content: step.code.trim()
    };

    currentFiles.push(fileNode);
    console.log('[BuilderPage] Created new file:', filePath);

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
      
      const {prompts, uiPrompts} = templateResponse.data;
      
      // Validate template response
      if (!uiPrompts || !Array.isArray(uiPrompts) || uiPrompts.length === 0) {
        console.error('Invalid template response:', templateResponse.data);
        return;
      }

      // Parse template steps
      let templateSteps: Step[] = [];
      try {
        templateSteps = parseXml(uiPrompts[0])
          .filter((step: Step) => {
            // Filter out steps without necessary data
            if (step.type === StepType.CreateFile) {
              return step.path && step.code;
            }
            return true;
          })
          .map((x: Step, index: number) => ({
            ...x,
            id: index + 1,
            status: "pending" as "pending"
          }));
        
        // Process template files first
        let updatedFiles: FileItem[] = [];
        templateSteps.forEach(step => {
          if (step.type === StepType.CreateFile) {
            updatedFiles = processFileStep(step, updatedFiles);
          }
        });
        
        setFiles(updatedFiles);
        setSteps(templateSteps);
        
        console.log('Template steps processed:', templateSteps.length);
      } catch (parseError) {
        console.error('Error parsing template XML:', parseError);
        return;
      }

      // Step 2: Get chat response
      console.log('Getting chat steps...');
      
      // Validate prompts before sending
      if (!Array.isArray(prompts)) {
        console.error('Invalid prompts array:', prompts);
        return;
      }

      // Construct messages array carefully
      const messages = prompts.map(content => ({
        role: "user" as const,
        content: typeof content === 'string' ? content : JSON.stringify(content)
      }));

      // Add the final prompt
      messages.push({
        role: "user" as const,
        content: prompt
      });

      console.log('Sending chat request with messages:', JSON.stringify(messages, null, 2));
      
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
        // Filter out invalid steps but allow updates to existing files
        const filteredChatSteps = chatSteps.filter((step: Step) => {
          if (step.type === StepType.CreateFile) {
            // Only filter out steps without required data
            return step.path && step.code;
          }
          return true;
        });

        // Update files from filtered chat steps
        setFiles(prevFiles => {
          let newFiles = [...prevFiles];
          filteredChatSteps.forEach(step => {
            if (step.type === StepType.CreateFile) {
              newFiles = processFileStep(step, newFiles);
            }
          });
          return newFiles;
        });

        // Add filtered chat steps
        setSteps(prevSteps => [
          ...prevSteps,
          ...filteredChatSteps.map((x, index) => ({
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
          status: step.id === firstStep.id ? "in-progress" : step.status
        })));
        setCurrentStep({ ...firstStep, status: "in-progress" });
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
            // Find next uncompleted step and mark it as in-progress
            if (step.id === currentStep.id + 1 && step.status === "pending") {
              return { ...step, status: "in-progress" as const };
            }
            return step;
          });

          // Find the new current step
          const nextStep = updatedSteps.find(step => step.status === "in-progress");
          if (nextStep) {
            setCurrentStep({ ...nextStep, status: "in-progress" });
          } else {
            setCurrentStep(null);
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