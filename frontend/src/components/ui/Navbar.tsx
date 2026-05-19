import { Link, useLocation, useNavigate } from 'react-router-dom'
import { TreePine, BookOpen, Star, User, LogOut, Sprout, Compass, Library } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../../api/auth'

const navLinks = [
  { to: '/dashboard', icon: TreePine, label: 'Garden' },
  { to: '/quran', icon: Library, label: 'Quran' },
  { to: '/journey', icon: Compass, label: 'Journey' },
  { to: '/reflections', icon: BookOpen, label: 'Reflect' },
  { to: '/milestones', icon: Star, label: 'Milestones' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 5 * 60_000,
  })

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <>
      {/* Desktop top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 glass border-b border-white/30">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-garden-600 rounded-lg flex items-center justify-center shadow-md">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-semibold text-garden-800 text-lg">Rawdah</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active ? 'bg-garden-100 text-garden-700' : 'text-gray-600 hover:bg-garden-50 hover:text-garden-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              {user.profile_photo_path ? (
                <img
                  src={user.profile_photo_path}
                  alt={user.username}
                  className="w-7 h-7 rounded-full object-cover border border-garden-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-garden-200 flex items-center justify-center text-garden-700 font-semibold text-xs">
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium">{user.username}</span>
              <span className="text-earth-600 font-bold">🔥 {user.streak_count}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/30 flex justify-around py-2 pb-safe">
        {navLinks.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                active ? 'text-garden-700' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-garden-600' : ''}`} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
