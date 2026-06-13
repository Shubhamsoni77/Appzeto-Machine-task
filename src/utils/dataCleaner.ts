import { parse, isValid, parseISO } from 'date-fns';
import type { RawTask, Task, Status, CleanResult } from '../types';

function parseCustomDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  // 2026-06-10
  const d1 = parseISO(dateStr);
  if (isValid(d1)) return d1;
  
  // 10/06/2026 (DD/MM/YYYY)
  const d2 = parse(dateStr, 'dd/MM/yyyy', new Date());
  if (isValid(d2)) return d2;
  
  // June 5, 2026
  const d3 = parse(dateStr, 'MMMM d, yyyy', new Date());
  if (isValid(d3)) return d3;
  
  return null;
}

export function cleanData(rawTasks: RawTask[]): CleanResult {
  let repairCount = 0;
  
  // 1. Duplicate IDs
  // "Keep the record that appears later in the file and discard the earlier one"
  const taskMap = new Map<string, RawTask>();
  for (const raw of rawTasks) {
    taskMap.set(raw.id, raw);
  }
  
  const uniqueTasks = Array.from(taskMap.values());
  const validStatuses = ['Backlog', 'In Progress', 'Review', 'Done'];
  
  const cleanedTasks: Task[] = uniqueTasks.map(raw => {
    let repairsInThisTask = 0;
    
    // 2. Broken assignees
    let assignee = raw.assignee;
    if (!assignee || assignee === '' || assignee.toLowerCase() === 'n/a') {
      assignee = 'Unassigned';
    }
    
    // 3. Bad estimates
    let est = 0;
    const estParsed = Number(raw.estimateHours);
    if (isNaN(estParsed) || estParsed < 0) {
      est = 0;
      repairsInThisTask++; // Negative or non-numeric count as repair
    } else {
      est = estParsed;
    }
    
    // 4. Invalid statuses
    let status = raw.status as Status;
    let hasInvalidStatus = false;
    if (!validStatuses.includes(status)) {
      status = 'Backlog';
      hasInvalidStatus = true;
      repairsInThisTask++;
    }
    
    // 5. Dates
    const dueDate = parseCustomDate(raw.dueDate);
    const completedDate = parseCustomDate(raw.completedDate);
    
    repairCount += repairsInThisTask;
    
    return {
      id: raw.id,
      title: raw.title,
      assignee,
      estimateHours: est,
      status,
      dueDate,
      completedDate,
      hasInvalidStatus,
      priority: raw.priority,
      tags: raw.tags
    };
  });
  
  return {
    tasks: cleanedTasks,
    repairCount
  };
}
