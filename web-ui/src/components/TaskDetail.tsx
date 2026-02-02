import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskById, updateTask } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

interface TaskDetailProps {
  taskId: string | null;
  onClose: () => void;
  onPrevTask?: () => void;
  onNextTask?: () => void;
  hasPrevTask?: boolean;
  hasNextTask?: boolean;
}

export default function TaskDetail({ 
  taskId, 
  onClose, 
  onPrevTask, 
  onNextTask, 
  hasPrevTask = false, 
  hasNextTask = false 
}: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => (taskId ? getTaskById(taskId) : null),
    enabled: !!taskId,
  });

  // Set edit content when task data is loaded
  useEffect(() => {
    if (task) {
      setEditContent(task.content);
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) => 
      updateTask(taskId, content),
    onSuccess: () => {
      // Invalidate and refetch the task query to update the UI
      queryClient.invalidateQueries({ queryKey: ['task', taskId] as const });
      setIsEditing(false);
    }
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (taskId) {
      updateTaskMutation.mutate({ taskId, content: editContent });
    }
  };

  const handleCancelClick = () => {
    if (task) {
      setEditContent(task.content);
    }
    setIsEditing(false);
  };

  if (!taskId) return null;

  return (
    <Dialog open={!!taskId} onClose={onClose} className="relative z-10">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10 md:pl-16">
            <DialogPanel className="pointer-events-auto w-screen max-w-2xl transform transition duration-500 ease-in-out sm:max-w-xl md:max-w-2xl">
              <div className="glass-panel-xl flex h-full flex-col overflow-y-auto rounded-none sm:rounded-l-xl border-l border-ny-border bg-ny-surface py-4 shadow-glass-lg sm:py-6">
                <div className="px-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <DialogTitle className="font-editorial min-w-0 flex-1 text-base font-semibold text-ny-text break-words sm:text-lg">
                      {isLoading ? 'Loading...' : error ? 'Error loading task' : task?.title}
                    </DialogTitle>
                    <div className="flex h-7 shrink-0 items-center gap-1 sm:ml-3 sm:gap-2">
                      {!isEditing && task && (
                        <button
                          type="button"
                          onClick={handleEditClick}
                          className="relative rounded-lg bg-ny-surface-elevated text-ny-text-muted hover:text-ny-text hover:bg-ny-accent-muted focus:outline-none focus:ring-2 focus:ring-ny-accent focus:ring-offset-2 focus:ring-offset-ny-bg"
                          aria-label="Edit task"
                        >
                          <span className="absolute -inset-2.5" />
                          <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                      {onPrevTask && !isEditing && (
                        <button
                          type="button"
                          onClick={onPrevTask}
                          disabled={!hasPrevTask}
                          className="relative rounded-lg bg-ny-surface-elevated text-ny-text-muted hover:text-ny-text hover:bg-ny-accent-muted focus:outline-none focus:ring-2 focus:ring-ny-accent focus:ring-offset-2 focus:ring-offset-ny-bg disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Previous task"
                        >
                          <span className="absolute -inset-2.5" />
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                      {onNextTask && !isEditing && (
                        <button
                          type="button"
                          onClick={onNextTask}
                          disabled={!hasNextTask}
                          className="relative rounded-lg bg-ny-surface-elevated text-ny-text-muted hover:text-ny-text hover:bg-ny-accent-muted focus:outline-none focus:ring-2 focus:ring-ny-accent focus:ring-offset-2 focus:ring-offset-ny-bg disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Next task"
                        >
                          <span className="absolute -inset-2.5" />
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={isEditing ? handleCancelClick : onClose}
                        className="relative rounded-lg bg-ny-surface-elevated text-ny-text-muted hover:text-ny-text hover:bg-ny-accent-muted focus:outline-none focus:ring-2 focus:ring-ny-accent focus:ring-offset-2 focus:ring-offset-ny-bg"
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative mt-4 flex-1 px-4 sm:px-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ny-accent" aria-hidden />
                    </div>
                  ) : error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-red-200">
                            Error loading task: {error instanceof Error ? error.message : 'Unknown error'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : task ? (
                    <div className="space-y-6 flex flex-col gap-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-4">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full min-h-[200px] p-3 rounded-lg border border-ny-border bg-ny-surface-elevated text-ny-text placeholder-ny-text-muted focus:outline-none focus:ring-2 focus:ring-ny-accent text-sm font-mono"
                          />
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleCancelClick}
                              className="px-4 py-2 text-sm font-medium text-ny-text bg-ny-surface-elevated border border-ny-border rounded-lg hover:bg-ny-accent-muted focus:outline-none focus:ring-2 focus:ring-ny-accent focus:ring-offset-2 focus:ring-offset-ny-bg"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveClick}
                              disabled={updateTaskMutation.isPending}
                              className="px-4 py-2 text-sm font-medium text-ny-bg bg-ny-accent rounded-lg hover:bg-ny-accent-hover focus:outline-none focus:ring-2 focus:ring-ny-accent focus:ring-offset-2 focus:ring-offset-ny-bg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updateTaskMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                          {updateTaskMutation.isError && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mt-2">
                              <div className="flex">
                                <div className="ml-3">
                                  <p className="text-sm text-red-200">
                                    Error updating task: {updateTaskMutation.error instanceof Error ? updateTaskMutation.error.message : 'Unknown error'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <MarkdownRenderer 
                            content={task.content} 
                            className="mt-2 text-sm text-ny-text-muted prose-invert max-w-none" 
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-editorial text-base font-semibold text-ny-text">Details</h3>
                        <dl className="mt-2 divide-y divide-ny-border border-t border-b border-ny-border">
                          <div className="flex flex-wrap justify-between gap-x-4 py-3 text-sm">
                            <dt className="text-ny-text-muted">Created</dt>
                            <dd className="text-ny-text">{new Date(task.created_at).toLocaleString()}</dd>
                          </div>
                          <div className="flex flex-wrap justify-between gap-x-4 py-3 text-sm">
                            <dt className="text-ny-text-muted">Updated</dt>
                            <dd className="text-ny-text">{new Date(task.updated_at).toLocaleString()}</dd>
                          </div>
                          {task.update_reason && (
                            <div className="flex flex-col gap-1 py-3 text-sm">
                              <dt className="text-ny-text-muted">Update Reason</dt>
                              <dd className="text-ny-text">{task.update_reason}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
