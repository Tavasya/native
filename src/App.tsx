// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import Navbar from '@/components/NavBar';
import AppRoutes from '@/routes';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />      {/* persistent layout element */}
      <AppRoutes />   {/* all route definitions */}
    </BrowserRouter>
  );
}
