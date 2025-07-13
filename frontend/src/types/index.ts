export enum StepType {
  CreateFile,
  CreateFolder,
  EditFile,
  DeleteFile,
  RunScript
}
export interface Step {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  substeps?: string[];
}