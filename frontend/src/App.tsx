import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import JourneyPage from './pages/JourneyPage'
import SessionPage from './pages/SessionPage'
import ReflectionsPage from './pages/ReflectionsPage'
import MilestonesPage from './pages/MilestonesPage'
import ProfilePage from './pages/ProfilePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function Private({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

function Public({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Public><AuthPage /></Public>} />
          <Route path="/dashboard" element={<Private><DashboardPage /></Private>} />
          <Route path="/journey" element={<Private><JourneyPage /></Private>} />
          <Route path="/session/:type" element={<Private><SessionPage /></Private>} />
          <Route path="/reflections" element={<Private><ReflectionsPage /></Private>} />
          <Route path="/milestones" element={<Private><MilestonesPage /></Private>} />
          <Route path="/profile" element={<Private><ProfilePage /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
