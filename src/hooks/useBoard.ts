import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import { cleanData } from '../utils/dataCleaner';

const STORAGE_KEY = 'appzeto-board-state';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface BoardState {
  tasks: Task[];
  repairCount: number;
  loadedCount: number;
}

export function useBoard() {
  const [state, setState] = useState<BoardState | null>(null);
  const [past, setPast] = useState<Task[][]>([]);
  const [future, setFuture] = useState<Task[][]>([]);
  
  // Loading the board from API
  const loadInitialData = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      const data = await res.json();
      
      // Revive dates
      const tasks = data.map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        completedDate: t.completedDate ? new Date(t.completedDate) : null,
      }));
      
      const newState = {
        tasks,
        repairCount: 0, // Backend seeded cleaned data
        loadedCount: tasks.length
      };
      
      setState(newState);
      setPast([]);
      setFuture([]);
    } catch (e) {
      console.error("Failed to load tasks from API", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const resetBoard = () => {
    loadInitialData(true);
  };

  const saveTasks = (newTasks: Task[], pushHistory = true) => {
    if (!state) return;
    
    if (pushHistory) {
      setPast(prev => [...prev, state.tasks].slice(-50)); // Max 50 history steps
      setFuture([]);
    }
    
    const newState = { ...state, tasks: newTasks };
    setState(newState);
  };

  const addTask = async (newTask: Task) => {
    if (!state) return;
    
    try {
      await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      saveTasks([...state.tasks, newTask]);
    } catch (e) {
      console.error("Failed to add task", e);
    }
  };

  const updateTaskInDb = async (task: Task) => {
    try {
      await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };
  const updateTaskFull = async (updatedTask: Task) => {
    if (!state) return;
    
    try {
      await fetch(`${API_URL}/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
      const newTasks = state.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
      saveTasks(newTasks);
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!state) return;
    
    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      const newTasks = state.tasks.filter(t => t.id !== taskId);
      saveTasks(newTasks);
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };
  const undo = useCallback(() => {
    if (past.length === 0 || !state) return;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture(prev => [state.tasks, ...prev]);
    setPast(newPast);
    
    const newState = { ...state, tasks: previous };
    setState(newState);
  }, [past, state]);

  const redo = useCallback(() => {
    if (future.length === 0 || !state) return;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    setPast(prev => [...prev, state.tasks]);
    setFuture(newFuture);
    
    const newState = { ...state, tasks: next };
    setState(newState);
  }, [future, state]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    saveTasks,
    addTask,
    updateTaskFull,
    deleteTask,
    updateTaskInDb,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    resetBoard
  };
}
