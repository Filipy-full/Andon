import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { OperatorTerminal } from './components/OperatorTerminal';
import { TVBoard } from './components/TVBoard';
import { AdminPanel } from './components/AdminPanel';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* Standalone views — no sidebar chrome */}
          <Route path="/operario" element={<OperatorTerminal />} />
          <Route path="/tv"       element={<TVBoard />} />

          {/* Main SaaS shell — with sidebar */}
          <Route path="/"      element={<Layout><Dashboard /></Layout>} />
          <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
