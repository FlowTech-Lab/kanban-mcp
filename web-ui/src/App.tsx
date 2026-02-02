import { Routes, Route, Navigate } from 'react-router-dom';
import BoardList from './components/BoardList';
import BoardDetail from './components/BoardDetail';
import NotificationContainer from './components/NotificationContainer';

function App() {
  return (
    <div className="min-h-screen min-h-dvh">
      <NotificationContainer />
      <header className="glass-panel sticky top-0 z-40 border-b border-ny-border bg-ny-surface/80 shadow-glass">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <h1 className="font-editorial text-xl font-semibold tracking-tight text-ny-text sm:text-2xl md:text-3xl">MCP Kanban</h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
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
