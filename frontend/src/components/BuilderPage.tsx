import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from './config';
import axios from 'axios';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Header from './Header';
import { parseXml } from './steps';
import { Step } from '../types';

const BuilderPage: React.FC = () => {
  const location = useLocation();
  const prompt = location.state?.prompt || 'Create a modern website';
  const [steps, setSteps] = useState<Step[]>([]);

  async function init(){
    const response = await axios.post(`${BACKEND_URL}/template`,{
      prompt : prompt.trim()
    });
    console.log(response);
    const {prompts,uiPrompts} = response.data;
    setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: "pending"
    })));
    console.log(steps);
    const stepsMessages = await axios.post(`${BACKEND_URL}/chat`,{
      messages: [...prompts,prompt].map((msg: string) => ({ role: 'user', content: msg })),
    })
    console.log(stepsMessages.data);
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header prompt={prompt} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar prompt={prompt} steps={steps} />
        <MainContent />
      </div>
    </div>
  );
};

export default BuilderPage;