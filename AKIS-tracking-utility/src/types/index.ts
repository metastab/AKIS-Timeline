export type StatusType = 'not started' | 'working' | 'done';
export type PriorityType = 'Low' | 'Medium' | 'High';

export interface TaskItem {
  id: number;
  system_id: number;
  feature: string;
  description: string | null;
  priority: PriorityType;
  status: StatusType;
  created_at?: string;
}

export interface SystemInfo {
  id: number;
  name: string;
  tableName: string;
  description: string;
  iconName: string;
}

export interface SystemStats {
  total: number;
  done: number;
  working: number;
  notStarted: number;
  completionPercent: number;
}
