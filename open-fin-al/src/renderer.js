import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootstrapAdaptiveFeatures } from './application/adaptive-learning/bootstrapAdaptiveFeatures';
import { bootstrapAdaptiveLearningContent } from './application/adaptive-learning/bootstrapAdaptiveLearningContent';
import { App } from './View/App';

bootstrapAdaptiveFeatures();
bootstrapAdaptiveLearningContent();

const root = ReactDOM.createRoot(document.getElementById('root'));

// for development
/*React.StrictMode //can cause weird side effects, such as stock data running twice on page load
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);*/

// for production
root.render(
  <App />
);


