import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { FindJobsPage } from '@/pages/FindJobsPage';
import { SavedJobsPage } from '@/pages/SavedJobsPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { PreparationPage } from '@/pages/PreparationPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/jobs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FindJobsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/saved"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SavedJobsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/applications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ApplicationsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/preparation"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PreparationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
