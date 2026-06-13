import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Task, Status } from '../types';

interface TaskModalProps {
  existingTask?: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ existingTask, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(existingTask?.title || '');
  const [assignee, setAssignee] = useState(existingTask?.assignee && existingTask.assignee !== 'Unassigned' ? existingTask.assignee : '');
  const [estimateHours, setEstimateHours] = useState(existingTask?.estimateHours?.toString() || '');
  const [priority, setPriority] = useState(existingTask?.priority || 'Medium');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: existingTask ? existingTask.id : `T-${Math.floor(1000 + Math.random() * 9000)}`, // Generate random ID T-XXXX
      title: title.trim(),
      assignee: assignee.trim() || 'Unassigned',
      estimateHours: parseInt(estimateHours) || 0,
      status: existingTask ? existingTask.status : ('Backlog' as Status),
      dueDate: existingTask ? existingTask.dueDate : null,
      completedDate: existingTask ? existingTask.completedDate : null,
      priority,
      tags: existingTask ? existingTask.tags : [],
    };
    
    onSave(newTask);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{existingTask ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title <span className="required">*</span></label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Implement login API"
              autoFocus
              required
            />
          </div>
          
          <div className="form-group">
            <label>Assignee</label>
            <input 
              type="text" 
              value={assignee} 
              onChange={e => setAssignee(e.target.value)} 
              placeholder="e.g. Priya Sharma"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Estimate Hours</label>
              <input 
                type="number" 
                min="0"
                value={estimateHours} 
                onChange={e => setEstimateHours(e.target.value)} 
                placeholder="e.g. 5"
              />
            </div>
            
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          
          <div className="modal-footer" style={{ justifyContent: existingTask && onDelete ? 'space-between' : 'flex-end' }}>
            {existingTask && onDelete && (
              <button 
                type="button" 
                className="btn" 
                style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(existingTask.id);
                    onClose();
                  }
                }}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
                {existingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
