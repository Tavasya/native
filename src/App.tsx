// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes';
import SubmissionFeedback from './pages/student/SubmissionFeedback';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
