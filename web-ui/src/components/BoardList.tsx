import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAllBoards, deleteBoard } from '../services/api';
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { Board } from '../types';

export default function BoardList() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: getAllBoards,
  });

  const handleDeleteClick = (boardId: string, boardName: string) => {
    setBoardToDelete({ id: boardId, name: boardName });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteBoard(boardToDelete.id);
      // Invalidate the boards query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    } catch (error) {
      console.error('Error deleting board:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-label="Loading boards">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4 backdrop-blur-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-200">
              Error loading boards: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-white">Kanban Boards</h1>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="glass-panel overflow-hidden rounded-xl border border-white/10 bg-white/5 px-6 py-5 shadow-glass sm:px-8">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th scope="col" className="py-5 pl-5 pr-4 text-left text-sm font-semibold text-slate-200">
                      Name
                    </th>
                    <th scope="col" className="px-5 py-5 text-left text-sm font-semibold text-slate-200">
                      Goal
                    </th>
                    <th scope="col" className="px-5 py-5 text-left text-sm font-semibold text-slate-200">
                      Created At
                    </th>
                    <th scope="col" className="px-5 py-5 text-left text-sm font-semibold text-slate-200">
                      Updated At
                    </th>
                    <th scope="col" className="relative py-5 pl-4 pr-5 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {boards?.map((board: Board) => (
                    <tr key={board.id} className="hover:bg-white/5 transition-colors">
                      <td className="whitespace-nowrap py-5 pl-5 pr-4 text-sm font-medium text-white">
                        {board.name}
                      </td>
                      <td className="px-5 py-5 text-sm text-slate-400 max-w-[200px] overflow-hidden text-ellipsis">{board.goal}</td>
                      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-400">
                        {new Date(board.created_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-400">
                        {new Date(board.updated_at).toLocaleString()}
                      </td>
                      <td className="relative whitespace-nowrap py-5 pl-4 pr-5 text-right text-sm font-medium">
                        <Link to={`/boards/${board.id}`} className="text-indigo-400 hover:text-indigo-300 mr-4">
                          View<span className="sr-only">, {board.name}</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(board.id, board.name)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete<span className="sr-only">, {board.name}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="glass-panel-xl mx-auto max-w-sm rounded-xl border border-white/10 bg-white/10 p-6 shadow-glass-lg">
            <DialogTitle className="text-lg font-medium text-white">
              Delete Board
            </DialogTitle>
            
            <div className="mt-2">
              <p className="text-sm text-slate-300">
                Are you sure you want to delete the board "{boardToDelete?.name}"? 
                This action cannot be undone and all tasks will be permanently deleted.
              </p>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-transparent bg-red-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
