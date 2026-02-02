import { useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBoardWithColumnsAndTasks, moveTask } from "../services/api";
import Column from "./Column";
import TaskDetail from "./TaskDetail";
import { DragAndDropProvider } from "../contexts/DragAndDropContext";
import { useNotifications } from "./NotificationContainer";
import type { ColumnWithTasks, TaskSummary } from "../types";

export default function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const { data, isLoading, error } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => (boardId ? getBoardWithColumnsAndTasks(boardId) : null),
    enabled: !!boardId,
  });

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTaskId(null);
  };

  // Find the current column and task index
  const currentColumnAndTaskIndex = useMemo(() => {
    if (!selectedTaskId || !data?.columns) return null;

    for (const column of data.columns) {
      const taskIndex = column.tasks.findIndex(
        (task: TaskSummary) => task.id === selectedTaskId
      );
      if (taskIndex !== -1) {
        return { column, taskIndex };
      }
    }
    return null;
  }, [selectedTaskId, data?.columns]);

  // Navigate to previous task in the same column
  const handlePrevTask = useCallback(() => {
    if (!currentColumnAndTaskIndex) return;

    const { column, taskIndex } = currentColumnAndTaskIndex;
    if (taskIndex > 0) {
      setSelectedTaskId(column.tasks[taskIndex - 1].id);
    }
  }, [currentColumnAndTaskIndex]);

  // Navigate to next task in the same column
  const handleNextTask = useCallback(() => {
    if (!currentColumnAndTaskIndex) return;

    const { column, taskIndex } = currentColumnAndTaskIndex;
    if (taskIndex < column.tasks.length - 1) {
      setSelectedTaskId(column.tasks[taskIndex + 1].id);
    }
  }, [currentColumnAndTaskIndex]);

  // Check if there are previous or next tasks available
  const hasPrevTask = useMemo(() => {
    return currentColumnAndTaskIndex
      ? currentColumnAndTaskIndex.taskIndex > 0
      : false;
  }, [currentColumnAndTaskIndex]);

  const hasNextTask = useMemo(() => {
    if (!currentColumnAndTaskIndex) return false;
    const { column, taskIndex } = currentColumnAndTaskIndex;
    return taskIndex < column.tasks.length - 1;
  }, [currentColumnAndTaskIndex]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-label="Loading board">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ny-accent" aria-hidden />
      </div>
    );
  }

  // Handle moving a task between columns
  const handleMoveTask = async (
    taskId: string,
    _sourceColumnId: string,
    destinationColumnId: string
  ) => {
    try {
      // Perform the actual API call
      await moveTask(taskId, destinationColumnId);

      // Invalidate the query to refetch the board data
      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    } catch (error) {
      console.error("Failed to move task:", error);

      // Show detailed error message
      if (error instanceof Error) {
        if (error.message.includes("capacity limit")) {
          notifications.error(
            "Column capacity limit reached",
            "This column has reached its maximum capacity. Complete or move existing tasks before adding new ones."
          );
        } else {
          notifications.error("Failed to move task", error.message);
        }
      } else {
        notifications.error(
          "Failed to move task",
          "An unexpected error occurred while moving the task."
        );
      }

      // Refetch to ensure UI is in sync with server state
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });

      return Promise.reject(error);
    }
  };

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-red-200">
              Error loading board:{" "}
              {error instanceof Error ? error.message : "Board not found"}
            </p>
            <div className="mt-2">
              <Link
                to="/boards"
                className="text-sm font-medium text-red-300 hover:text-red-200"
              >
                Go back to boards list
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { board, columns } = data;

  return (
    <div className="min-w-0 w-full">
      <div className="glass-panel mb-4 rounded-xl border border-ny-border bg-ny-surface/60 p-3 shadow-glass sm:mb-6 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-editorial text-lg font-semibold text-ny-text break-words sm:text-xl md:text-2xl">{board.name}</h2>
            <p className="mt-1 text-xs text-ny-text-muted line-clamp-2 sm:line-clamp-none sm:text-sm md:text-base">{board.goal}</p>
          </div>
          <Link
            to="/boards"
            className="shrink-0 self-start rounded-lg border border-ny-border bg-ny-surface-elevated px-3 py-2 text-sm font-medium text-ny-text shadow-glass hover:bg-ny-accent-muted hover:border-ny-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ny-accent"
          >
            Back to Boards
          </Link>
        </div>
      </div>

      {/* Horizontal scroll area – explicit flex, left-aligned (narrow desktop + mobile) */}
      <div className="scroll-board -mx-3 w-full max-w-full overflow-x-auto pb-4 sm:mx-0 sm:pb-6">
        <DragAndDropProvider onMoveTask={handleMoveTask}>
          <div className="flex flex-row flex-nowrap justify-start items-stretch gap-3 min-w-max px-3 pb-2 sm:gap-4 sm:px-0 sm:pb-0">
            {columns.map((column: ColumnWithTasks) => (
              <div key={column.id} className="w-[240px] min-w-[240px] sm:w-[260px] sm:min-w-[260px] md:w-[280px] md:min-w-[280px]">
                <Column column={column} onTaskClick={handleTaskClick} />
              </div>
            ))}
          </div>
        </DragAndDropProvider>
      </div>

      <TaskDetail
        taskId={selectedTaskId}
        onClose={handleCloseTaskDetail}
        onPrevTask={handlePrevTask}
        onNextTask={handleNextTask}
        hasPrevTask={hasPrevTask}
        hasNextTask={hasNextTask}
      />
    </div>
  );
}
