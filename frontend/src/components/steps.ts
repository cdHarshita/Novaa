import { Step, StepType } from '.././types';

/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <boltArtifact id=\"project-import\" title=\"Project Files\">
 *  <boltAction type=\"file\" filePath=\"eslint.config.js\">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */
function sanitizeXmlContent(content: string): string {
  // Remove any null characters or invalid XML characters
  return content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function extractStepTitle(type: string, filePath?: string): string {
  if (type === 'file' && filePath) {
    return `Create ${filePath}`;
  } else if (type === 'shell') {
    return 'Run command';
  }
  return 'Unknown step';
}

function parseStepContent(content: string): Step[] {
  const steps: Step[] = [];
  
  try {
    // Try to parse as a single action
    const typeMatch = content.match(/type="([^"]*)"/);
    const filePathMatch = content.match(/filePath="([^"]*)"/);
    let codeMatch = content.match(/>([\s\S]*?)<\/boltAction>/);
    
    // Fallback for content without proper tags
    if (!codeMatch && !content.includes('</boltAction>')) {
      codeMatch = ['', content.trim()] as RegExpMatchArray;
    }

    if (typeMatch) {
      const type = typeMatch[1];
      const step: Partial<Step> = {
        id: 1,
        title: extractStepTitle(type, filePathMatch?.[1]),
        description: '',
        type: type === 'file' ? StepType.CreateFile : StepType.RunScript,
        status: 'pending'
      };

      if (type === 'file' && filePathMatch) {
        step.path = filePathMatch[1];
      }

      if (codeMatch) {
        step.code = codeMatch[1].trim();
      }

      if (step.code || step.path) {  // Only add steps that have some content
        steps.push(step as Step);
      }
    }
  } catch (error) {
    console.error('Error parsing step content:', error);
  }

  return steps;
}

export function parseXml(response: string): Step[] {
  if (!response || typeof response !== 'string') {
    console.warn('Invalid response provided to parseXml:', response);
    return [];
  }

  try {
    const sanitizedResponse = sanitizeXmlContent(response);
    
    // First try to extract the XML content between <boltArtifact> tags
    const xmlMatch = sanitizedResponse.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
    const steps: Step[] = [];
    let stepId = 1;

    // Extract artifact title from the full response
    const titleMatch = sanitizedResponse.match(/title="([^"]*)"/);
    const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';

    // Add initial artifact step
    steps.push({
      id: stepId++,
      title: artifactTitle,
      description: '',
      type: StepType.CreateFolder,
      status: 'pending'
    });

    let contentToProcess: string;
    if (xmlMatch) {
      contentToProcess = xmlMatch[1];
    } else {
      // If no XML tags found, try to parse as direct content
      console.warn('No <boltArtifact> tags found, attempting to parse direct content');
      if (sanitizedResponse.includes('type="file"') || sanitizedResponse.includes('type="shell"')) {
        const directSteps = parseStepContent(sanitizedResponse);
        return directSteps.length > 0 ? [steps[0], ...directSteps] : steps;
      }
      return steps;
    }

    // Regular expression to find boltAction elements
    const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([^<]*(?:<(?!\/boltAction>)[^<]*)*)<\/boltAction>/g;
    
    let match;
    while ((match = actionRegex.exec(contentToProcess)) !== null) {
      const [, type, filePath, content] = match;
      
      if (!type || (!content && !filePath)) {
        console.warn('Skipping invalid action:', match[0]);
        continue;
      }

      const step: Partial<Step> = {
        id: stepId++,
        title: extractStepTitle(type, filePath),
        description: '',
        type: type === 'file' ? StepType.CreateFile : StepType.RunScript,
        status: 'pending',
        code: content?.trim()
      };

      if (type === 'file' && filePath) {
        step.path = filePath;
      }

      if (step.code || step.path) {  // Only add steps that have some content
        steps.push(step as Step);
      }
    }

    return steps.length > 1 ? steps : parseStepContent(sanitizedResponse);
  } catch (error) {
    console.error('Error parsing XML:', error);
    console.log('Failed content:', response);
    // Try one last time to parse as direct content
    const directSteps = parseStepContent(response);
    return directSteps;
  }
}