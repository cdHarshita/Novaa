// hooks/useWebContainer.ts
import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { getWebContainerInstance } from '../lib/webContainerInstance'

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const instance = await getWebContainerInstance();
        setWebcontainer(instance);
      } catch (err) {
        console.error('[WebContainer] Initialization failed:', err);
      }
    }

    init();
  }, []);

  return webcontainer;
}
