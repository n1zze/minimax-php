import { useLocation, useParams, Navigate } from 'react-router-dom'
import { useAuthStore, ROLE_CLIENT, ROLE_DESIGNER, ROLE_VISUALIZER } from '../../store/useAuthStore'

export function ProtectedRoute({ children, requireDesigner = false, requireAnyAuth = true }) {
  const { user } = useAuthStore()
  const { id } = useParams()
  const location = useLocation()
  const isVisualizerPath = location.pathname.startsWith('/visualizer/')
  const userProjectId = user?.projectId || user?.visualizerProjectId

  if (requireAnyAuth && !user) {
    if (id && isVisualizerPath) {
      return <Navigate to={`/visualizer/${id}/unlock`} replace />
    }
    if (id) {
      return <Navigate to={`/projects/${id}/unlock`} replace />
    }
    return <Navigate to="/login" replace />
  }

  if (requireDesigner && user?.role !== ROLE_DESIGNER) {
    return <Navigate to="/" replace />
  }

  if (isVisualizerPath) {
    if (user?.role !== ROLE_VISUALIZER && user?.role !== ROLE_DESIGNER) {
      return <Navigate to={userProjectId ? `/projects/${userProjectId}` : '/'} replace />
    }

    if (user?.role === ROLE_VISUALIZER && id && userProjectId !== id) {
      return <Navigate to={`/visualizer/${id}/unlock`} replace />
    }
  } else if (id) {
    if (user?.role === ROLE_CLIENT && userProjectId !== id) {
      return <Navigate to={`/projects/${id}/unlock`} replace />
    }

    if (user?.role === ROLE_VISUALIZER) {
      return <Navigate to={`/visualizer/${userProjectId || id}`} replace />
    }
  }

  return children
}
