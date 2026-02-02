import { Routes, Route, Navigate } from 'react-router-dom';
import BoardList from './components/BoardList';
import BoardDetail from './components/BoardDetail';
import NotificationContainer from './components/NotificationContainer';

function App() {
  return (
    <div className="flex min-h-screen min-h-dvh w-full max-w-full min-w-0 flex-col overflow-x-hidden">
      <NotificationContainer />
      <header className="glass-panel sticky top-0 z-40 shrink-0 border-b border-ny-border bg-ny-surface/80 shadow-glass">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
          <h1 className="font-editorial truncate text-lg font-semibold tracking-tight text-ny-text sm:text-xl md:text-2xl lg:text-3xl">MCP Kanban</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/boards" replace />} />
          <Route path="/boards" element={<BoardList />} />
          <Route path="/boards/:boardId" element={<BoardDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
