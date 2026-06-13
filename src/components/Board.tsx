import React, { useState, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { isBefore, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { Task, Status } from '../types';
import { Column } from './Column';
import { FilterBar } from './FilterBar';
import { TaskModal } from './TaskModal';
import { useBoard } from '../hooks/useBoard';
import { Undo2, Redo2, RotateCcw, Moon, Sun, Plus } from 'lucide-react';

const COLUMNS: Status[] = ['Backlog', 'In Progress', 'Review', 'Done'];
const WIP_LIMITS: Partial<Record<Status, number>> = {
  'In Progress': 5,
  'Review': 3
};

export const Board: React.FC = () => {
  const { state, saveTasks, addTask, updateTaskFull, deleteTask, updateTaskInDb, undo, redo, canUndo, canRedo, resetBoard } = useBoard();
  
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<Status>('Backlog');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('appzeto-theme') === 'dark';
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('appzeto-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('appzeto-theme', 'light');
    }
  }, [isDark]);

  const isOverdue = (task: Task) => {
    if (task.status === 'Done' || !task.dueDate) return false;
    // For this example, let's say "today" is fixed or current date.
    // The instructions say "due date passed and status is not Done"
    return isBefore(task.dueDate, new Date());
  };

  const assignees = useMemo(() => {
    if (!state) return [];
    const set = new Set(state.tasks.map(t => t.assignee));
    return Array.from(set).sort();
  }, [state]);

  if (!state) return <div style={{ padding: '2rem' }}>Loading board...</div>;

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = source.droppableId as Status;
    const destStatus = destination.droppableId as Status;

    // Check WIP limit BEFORE moving
    if (sourceStatus !== destStatus && WIP_LIMITS[destStatus]) {
      const destCount = state.tasks.filter(t => t.status === destStatus).length;
      if (destCount >= WIP_LIMITS[destStatus]!) {
        // Trigger shake animation by setting session storage flag (TaskCard reads this)
        sessionStorage.setItem(`shake-${draggableId}`, 'true');
        // Force a re-render to apply the class
        saveTasks([...state.tasks], false); 
        // Toast message could be added here, for now shake is enough as per requirement
        return;
      }
    }

    const newTasks = [...state.tasks];
    const taskIndex = newTasks.findIndex(t => t.id === draggableId);
    if (taskIndex === -1) return;

    const taskToMove = newTasks[taskIndex];
    
    // Update status if moved to different column
    if (sourceStatus !== destStatus) {
      taskToMove.status = destStatus;
      if (destStatus === 'Done' && sourceStatus !== 'Done') {
        taskToMove.completedDate = new Date();
      }
      updateTaskInDb(taskToMove);
    }

    // Handle reordering visually by removing and inserting into the array
    // Note: Since we have filters, destination.index is relative to the FILTERED list.
    // To properly reorder in the global array, we need to find the correct insertion index.
    
    // 1. Get all tasks in destination column
    const destTasks = newTasks.filter(t => t.status === destStatus);
    // Remove the moving task from destTasks if it's already there (same column reorder)
    const filteredDestTasks = sourceStatus === destStatus 
      ? destTasks.filter(t => t.id !== draggableId)
      : destTasks;
      
    // 2. Insert the task at the requested index in the column's task list
    filteredDestTasks.splice(destination.index, 0, taskToMove);

    // 3. Rebuild the global tasks array while preserving order of other columns
    const finalTasks = [];
    let destTaskCounter = 0;
    
    // We map through the old tasks, but replace the destination column's tasks with our new ordered list
    for (const t of newTasks) {
      if (t.id === draggableId) continue; // Skip the moving task
      
      if (t.status === destStatus) {
        // Find the next task in our newly ordered destination list
        let nextTask = filteredDestTasks[destTaskCounter];
        if (nextTask.id === draggableId) {
          finalTasks.push(nextTask);
          destTaskCounter++;
          nextTask = filteredDestTasks[destTaskCounter];
        }
        if (nextTask) {
          finalTasks.push(nextTask);
          destTaskCounter++;
        }
      } else {
        finalTasks.push(t);
      }
    }
    
    // If we moved to an empty column or end of column, we might have leftover tasks in filteredDestTasks
    while (destTaskCounter < filteredDestTasks.length) {
      finalTasks.push(filteredDestTasks[destTaskCounter]);
      destTaskCounter++;
    }

    saveTasks(finalTasks);
  };

  const getVisibleTasks = (tasks: Task[], status: Status) => {
    return tasks.filter(t => {
      if (t.status !== status) return false;
      if (selectedAssignees.length > 0 && !selectedAssignees.includes(t.assignee)) return false;
      if (searchText && !t.title.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (overdueOnly && !isOverdue(t)) return false;
      return true;
    });
  };

  // Calculate hours done this week
  const getHoursDoneThisWeek = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    
    return state.tasks
      .filter(t => t.status === 'Done' && t.completedDate && isWithinInterval(t.completedDate, { start, end }))
      .reduce((sum, t) => sum + t.estimateHours, 0);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-title">Appzeto Sprint Board</div>
        
        <div className="header-actions">
          <div className={`health-badge ${state.repairCount > 0 ? 'has-issues' : ''}`}>
            {state.repairCount} issues fixed · {state.loadedCount} tasks loaded
          </div>
          
          <div className="header-controls">
            <button className="btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
            <button className="btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
              <Redo2 size={16} />
            </button>
          </div>

          <div className="header-controls">
            <button className="btn btn-primary" onClick={() => { setEditingTask(undefined); setIsModalOpen(true); }}>
              <Plus size={16} />
              New Task
            </button>
            <button className="btn" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-primary" onClick={resetBoard}>
              <RotateCcw size={16} />
              Reset board
            </button>
          </div>
        </div>
      </header>

      <FilterBar
        assignees={assignees}
        selectedAssignees={selectedAssignees}
        onChangeAssignees={setSelectedAssignees}
        searchText={searchText}
        onChangeSearchText={setSearchText}
        overdueOnly={overdueOnly}
        onChangeOverdueOnly={setOverdueOnly}
      />

      <div className="mobile-tabs">
        {COLUMNS.map(col => (
          <button 
            key={col}
            className={`tab-btn ${activeTab === col ? 'active' : ''}`}
            onClick={() => setActiveTab(col)}
          >
            {col} ({state.tasks.filter(t => t.status === col).length})
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-container">
          {COLUMNS.map(col => {
            const columnTasks = state.tasks.filter(t => t.status === col);
            const visibleTasks = getVisibleTasks(state.tasks, col);
            
            return (
              <Column
                key={col}
                id={col}
                title={col}
                tasks={columnTasks}
                visibleTasks={visibleTasks}
                isActive={activeTab === col}
                isOverdue={isOverdue}
                hoursCompletedThisWeek={col === 'Done' ? getHoursDoneThisWeek() : undefined}
                onEdit={(task) => {
                  setEditingTask(task);
                  setIsModalOpen(true);
                }}
              />
            );
          })}
        </div>
      </DragDropContext>

      {isModalOpen && (
        <TaskModal 
          existingTask={editingTask}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(undefined);
          }} 
          onSave={(task) => {
            if (editingTask) {
              updateTaskFull(task);
            } else {
              addTask(task);
            }
          }} 
          onDelete={(taskId) => {
            deleteTask(taskId);
          }}
        />
      )}
    </>
  );
};
