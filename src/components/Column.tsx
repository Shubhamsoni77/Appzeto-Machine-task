import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { Task, Status } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: Status;
  title: string;
  tasks: Task[]; // The full list of tasks for calculating stats
  visibleTasks: Task[]; // The filtered list of tasks for rendering
  isActive: boolean;
  isOverdue: (task: Task) => boolean;
  hoursCompletedThisWeek?: number; // Only for "Done" column
  onEdit: (task: Task) => void;
}

const DOT_CLASS_MAP: Record<Status, string> = {
  'Backlog': 'dot-backlog',
  'In Progress': 'dot-inprogress',
  'Review': 'dot-review',
  'Done': 'dot-done'
};

export const Column: React.FC<ColumnProps> = ({ 
  id, 
  title, 
  tasks, 
  visibleTasks, 
  isActive, 
  isOverdue,
  hoursCompletedThisWeek,
  onEdit
}) => {
  const totalHours = tasks.reduce((sum, t) => sum + t.estimateHours, 0);

  return (
    <div className={`board-column ${isActive ? 'active' : ''}`}>
      <div className="column-header">
        <div className="column-title">
          <div className={`column-dot ${DOT_CLASS_MAP[id]}`}></div>
          <span>{title}</span>
        </div>
        <div className="column-stats">
          <span>{tasks.length} {tasks.length === 1 ? 'card' : 'cards'}</span>
          <span>{totalHours}h est.</span>
          {hoursCompletedThisWeek !== undefined && (
            <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>
              {hoursCompletedThisWeek}h done this week
            </span>
          )}
        </div>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-content ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
          >
            {visibleTasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                isOverdue={isOverdue(task)}
                onEdit={onEdit}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
