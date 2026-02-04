import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimation,
} from "@dnd-kit/core";
import { TaskSummary, ColumnWithTasks } from "../types";

interface DragAndDropContextType {
  isDragging: boolean;
}

const DragAndDropContext = createContext<DragAndDropContextType | undefined>(
  undefined
);

// Define the props for our provider component
interface DragAndDropProviderProps {
  children: ReactNode;
  columns: ColumnWithTasks[];
  onMoveTask?: (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string
  ) => Promise<void>;
  onReorderTask?: (
    taskId: string,
    columnId: string,
    position: number
  ) => Promise<void>;
}

export function DragAndDropProvider({
  children,
  columns,
  onMoveTask,
  onReorderTask,
}: DragAndDropProviderProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Configure sensors for drag detection with enhanced touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  );

  const columnIds = useMemo(() => new Set(columns.map((c) => c.id)), [columns]);
  const taskToColumn = useMemo(() => {
    const map = new Map<string, { column: ColumnWithTasks; index: number }>();
    for (const col of columns) {
      col.tasks.forEach((t, i) => map.set(t.id, { column: col, index: i }));
    }
    return map;
  }, [columns]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !active.data.current) {
        setIsDragging(false);
        return;
      }

      const task = active.data.current.task as TaskSummary;
      const sourceColumn = active.data.current.sourceColumn as ColumnWithTasks;
      const overId = over.id as string;

      if (columnIds.has(overId)) {
        // Dropped on a column (e.g. empty area) -> move to column
        if (overId !== sourceColumn.id && onMoveTask) {
          onMoveTask(task.id, sourceColumn.id, overId).catch((err) =>
            console.error("Failed to move task:", err)
          );
        }
      } else {
        // Dropped on a task
        const target = taskToColumn.get(overId);
        if (target) {
          if (target.column.id === sourceColumn.id) {
            // Same column -> reorder
            if (onReorderTask) {
              onReorderTask(task.id, sourceColumn.id, target.index).catch(
                (err) => console.error("Failed to reorder task:", err)
              );
            }
          } else if (onMoveTask) {
            onMoveTask(task.id, sourceColumn.id, target.column.id).catch(
              (err) => console.error("Failed to move task:", err)
            );
          }
        }
      }

      setIsDragging(false);
    },
    [columnIds, taskToColumn, onMoveTask, onReorderTask]
  );

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<DragAndDropContextType>(
    () => ({
      isDragging,
    }),
    [isDragging]
  );

  // Custom drop animation
  const dropAnimation = useMemo(
    () => ({
      ...defaultDropAnimation,
      dragSourceOpacity: 0.5,
    }),
    []
  );

  return (
    <DragAndDropContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}

        {/* Overlay that follows the cursor when dragging */}
        <DragOverlay dropAnimation={dropAnimation}>
          {/* The DragOverlay will automatically render the dragged element */}
        </DragOverlay>
      </DndContext>
    </DragAndDropContext.Provider>
  );
}

// Custom hook to use the drag and drop context
export function useDragAndDrop() {
  const context = useContext(DragAndDropContext);
  if (context === undefined) {
    throw new Error("useDragAndDrop must be used within a DragAndDropProvider");
  }
  return context;
}
