// src/renderer.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import App from './App';
import './index.css';
import { LoadingProvider } from './context/LoadingContext';
import LoadingOverlay from './components/LoadingOverlay';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Router>
    <LoadingProvider>
      <App />
      <LoadingOverlay />
    </LoadingProvider>
  </Router>
);
