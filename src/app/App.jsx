import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { Onboarding, useOnboardingBootstrap } from '../components/ui/Onboarding'

const HomePage = lazy(() => import('../features/projects/HomePage'))
const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const ProjectPage = lazy(() => import('../features/projects/ProjectPage/ProjectPage'))
const ProjectEditPage = lazy(() => import('../features/projects/ProjectEditPage'))
const UnlockPage = lazy(() => import('../features/projects/UnlockPage'))
const VisualizerUnlockPage = lazy(() => import('../features/projects/VisualizerUnlockPage'))
const DashboardPage = lazy(() => import('../features/projects/DashboardPage'))
const VisualizerPage = lazy(() => import('../features/projects/ProjectPage/VisualizerPage'))

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      color: 'var(--color-text-secondary)'
    }}>
      Загрузка...
    </div>
  )
}

function AuthBootstrap({ children }) {
  const { user, loading, hydrateFromToken } = useAuthStore()

  useEffect(() => {
    hydrateFromToken()
  }, [hydrateFromToken])

  // Auto-start onboarding for new users (per role, once per browser)
  useOnboardingBootstrap()

  if (loading && !user) {
    return <PageLoader />
  }

  return children
}

export function App() {
  // Initialize theme on mount (apply saved/system preference to <html>)
  useEffect(() => {
    useThemeStore.getState().init()
  }, [])

  return (
    <ErrorBoundary>
      <AuthBootstrap>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/projects/:id/unlock" element={<UnlockPage />} />
            <Route path="/visualizer/:id/unlock" element={<VisualizerUnlockPage />} />

            {/* Protected routes inside Layout */}
            <Route element={<Layout />}>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireDesigner>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/edit"
                element={
                  <ProtectedRoute requireDesigner>
                    <ProjectEditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visualizer/:id"
                element={
                  <ProtectedRoute>
                    <VisualizerPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Onboarding />
        </BrowserRouter>
      </AuthBootstrap>
    </ErrorBoundary>
  )
}
