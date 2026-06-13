export type Status = 'Backlog' | 'In Progress' | 'Review' | 'Done';

export interface RawTask {
  id: string;
  title: string;
  assignee: string | null;
  estimateHours: string | number;
  status: string;
  dueDate: string;
  completedDate: string | null;
  priority?: string;
  tags?: string[];
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  estimateHours: number;
  status: Status;
  dueDate: Date | null;
  completedDate: Date | null;
  hasInvalidStatus?: boolean;
  priority?: string;
  tags?: string[];
}

export interface CleanResult {
  tasks: Task[];
  repairCount: number;
}
