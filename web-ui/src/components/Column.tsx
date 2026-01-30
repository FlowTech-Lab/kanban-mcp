import { ColumnWithTasks } from '../types';
import TaskCard from './TaskCard';
import { useDroppable } from '@dnd-kit/core';
import { useDragAndDrop } from '../contexts/DragAndDropContext';

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
  const dropIndicatorStyle = isOver ? 'border-2 border-dashed border-indigo-400 bg-indigo-500/20' : '';
  return (
    <div 
      ref={setNodeRef}
      className={`glass-panel flex flex-col rounded-xl border border-white/10 bg-white/5 p-3 min-w-[250px] shadow-glass transition-colors ${isDragging ? dropIndicatorStyle : ''}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white">{column.name}</h3>
        <div className="flex items-center">
          <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-1 text-xs font-medium text-slate-200">
            {column.tasks.length} {column.wipLimit > 0 ? `/ ${column.wipLimit}` : ''}
          </span>
          {column.isLanding && (
            <span className="ml-2 inline-flex items-center rounded-full bg-indigo-500/30 px-2 py-1 text-xs font-medium text-indigo-200">
              Landing
            </span>
          )}
        </div>
      </div>
      <div className="overflow-visible flex-1">
        {column.tasks.length === 0 ? (
          <div className={`rounded-lg p-4 text-center text-sm text-slate-400 ${isOver ? 'bg-indigo-500/15 text-indigo-200' : ''}`}>
            {isOver ? 'Drop here' : 'No tasks'}
          </div>
        ) : (
          <ul className="space-y-2">
            {column.tasks.map((task) => (
              <li key={task.id} onClick={() => onTaskClick(task.id)}>
                <TaskCard 
                  task={task} 
                  column={column} 
                  isMoving={false}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
