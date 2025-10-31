import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './index.css';
import { startPlanner } from './agents/planner';
import { enableVoice } from './agents/voice';
import { startPrefetcher } from './agents/prefetcher';

startPlanner();
startPrefetcher();
if (typeof window !== 'undefined') {
  enableVoice();
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
