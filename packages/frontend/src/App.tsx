import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BoardsPage } from './pages/BoardsPage';
import { AssignedToMePage } from './pages/AssignedToMePage';
import { BoardActivityPage } from './pages/BoardActivityPage';
import { BoardViewPage } from './pages/BoardViewPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { OrganizationsListPage } from './pages/OrganizationsListPage';

/**
 * Main Application Component
 * Collaborative Kanban Board Application
 *
 * Features:
 * - Authentication with login/register
 * - Board management with real-time collaboration
 * - Card assignments and tracking
 * - Organization management
 * - Activity history
 *
 * Implementation Status: Complete (293/293 tasks) + UI Enhancement
 */

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes - Authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes - Require Authentication */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      {/* Default route - redirect to boards */}
                      <Route path="/" element={<Navigate to="/boards" replace />} />

                      {/* Boards Management */}
                      <Route path="/boards" element={<BoardsPage />} />
                      <Route path="/boards/:boardId" element={<BoardViewPage />} />
                      <Route path="/boards/:boardId/activity" element={<BoardActivityPage />} />

                      {/* Assigned Cards - User's tasks */}
                      <Route path="/assigned-to-me" element={<AssignedToMePage />} />

                      {/* Organization Management */}
                      <Route path="/organizations" element={<OrganizationsListPage />} />
                      <Route path="/organizations/:organizationId" element={<OrganizationPage />} />

                      {/* Activity Feed */}
                      <Route path="/activity" element={<BoardActivityPage />} />

                      {/* 404 - Not Found */}
                      <Route
                        path="*"
                        element={
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                              <p className="text-xl text-gray-600 mb-8">Page not found</p>
                              <a
                                href="/boards"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Go to Boards
                              </a>
                            </div>
                          </div>
                        }
                      />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
