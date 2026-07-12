import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/reports.css';

createRoot(document.getElementById('root')!).render(<App />);
