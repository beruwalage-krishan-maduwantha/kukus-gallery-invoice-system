import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import App from './App';
import { BRAND } from './brand';

document.documentElement.dataset.brand = BRAND.key;
document.title = BRAND.title;
const favicon = document.querySelector('link[rel="icon"]');
if (favicon) favicon.href = BRAND.logo;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
