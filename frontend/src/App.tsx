import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Learning } from '@/pages/Learning';
import { ModuleDetail } from '@/pages/ModuleDetail';
import { Quiz } from '@/pages/Quiz';
import { Assessment } from '@/pages/Assessment';
import { Games } from '@/pages/Games';
import { Tools } from '@/pages/Tools';
import { Admin } from '@/pages/Admin';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/:id" element={<ModuleDetail />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/games" element={<Games />} />
              <Route path="/tools" element={<Tools />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute admin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
