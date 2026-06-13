import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, AlertTriangle, Calendar, Edit2 } from 'lucide-react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  isOverdue: boolean;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, isOverdue, onEdit }) => {
  const isShake = sessionStorage.getItem(`shake-${task.id}`) === 'true';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''} ${isShake ? 'shake' : ''}`}
          style={{ ...provided.draggableProps.style }}
          onAnimationEnd={() => sessionStorage.removeItem(`shake-${task.id}`)}
        >
          <div className="task-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="task-id">{task.id}</span>
              {task.priority && (
                <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {task.hasInvalidStatus && (
                <span className="warning-icon" title="Invalid original status">
                  <AlertTriangle size={14} />
                </span>
              )}
              <button 
                className="btn-icon" 
                onClick={() => onEdit(task)}
                title="Edit Task"
                style={{ padding: '2px', color: 'var(--text-secondary)' }}
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
          
          <h4 className="task-title">{task.title}</h4>
          
          {task.tags && task.tags.length > 0 && (
            <div className="task-tags">
              {task.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
          
          <div className="task-footer">
            <div className="task-assignee">
              <div className="avatar">
                {task.assignee.substring(0, 1)}
              </div>
              <span>{task.assignee}</span>
            </div>
            
            <div className="task-meta">
              <div className={`task-meta-item ${isOverdue ? 'overdue' : ''}`}>
                <Calendar size={14} />
                <span>
                  {task.dueDate 
                    ? task.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'No date'}
                </span>
              </div>
              <div className="task-meta-item">
                <Clock size={14} />
                <span>{task.estimateHours}h</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
