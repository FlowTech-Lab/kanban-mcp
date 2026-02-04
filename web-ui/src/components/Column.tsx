import { ColumnWithTasks, TaskSummary } from '../types';
import TaskCard from './TaskCard';
import { useDroppable } from '@dnd-kit/core';
import { useDragAndDrop } from '../contexts/DragAndDropContext';

interface TaskDroppableProps {
  task: TaskSummary;
  column: ColumnWithTasks;
  onTaskClick: (taskId: string) => void;
}

function TaskDroppable({ task, column, onTaskClick }: TaskDroppableProps) {
  const { setNodeRef } = useDroppable({
    id: task.id,
    data: { task, column },
  });
  return (
    <li ref={setNodeRef} onClick={() => onTaskClick(task.id)}>
      <TaskCard task={task} column={column} isMoving={false} />
    </li>
  );
}

interface ColumnProps {
  column: ColumnWithTasks;
  onTaskClick: (taskId: string) => void;
}

export default function Column({ column, onTaskClick }: ColumnProps) {
  const { isDragging } = useDragAndDrop();
  
  // Set up this column as a droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      column
    }
  });
  
  // Apply styles when a task is being dragged over this column
  const dropIndicatorStyle = isOver ? 'border-2 border-dashed border-ny-accent bg-ny-accent-muted' : '';
  return (
    <div 
      ref={setNodeRef}
      className={`glass-panel flex flex-col rounded-xl border border-ny-border bg-ny-surface/60 p-3 shadow-glass transition-colors ${isDragging ? dropIndicatorStyle : ''}`}
    >
      <div className="flex justify-between items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-ny-text truncate">{column.name}</h3>
        <div className="flex items-center shrink-0">
          <span className="inline-flex items-center rounded-full bg-ny-surface-elevated px-2 py-0.5 text-xs font-medium text-ny-text-muted">
            {column.tasks.length} {column.wipLimit > 0 ? `/ ${column.wipLimit}` : ''}
          </span>
          {column.isLanding && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-ny-accent-muted px-2 py-0.5 text-xs font-medium text-ny-accent">
              Landing
            </span>
          )}
        </div>
      </div>
      <div className="overflow-visible flex-1 min-h-[60px]">
        {column.tasks.length === 0 ? (
          <div className={`rounded-lg p-4 text-center text-sm text-ny-text-muted ${isOver ? 'bg-ny-accent-muted text-ny-accent' : ''}`}>
            {isOver ? 'Drop here' : 'No tasks'}
          </div>
        ) : (
          <ul className="space-y-2">
            {column.tasks.map((task) => (
              <TaskDroppable
                key={task.id}
                task={task}
                column={column}
                onTaskClick={onTaskClick}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
