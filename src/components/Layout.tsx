import { Outlet, NavLink } from 'react-router-dom'
import { Heart, MessageCircle, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col">
      {/* Header with user info */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <User size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...'}
              </p>
              <p className="text-gray-400 text-xs">{profile?.email}</p>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <User size={20} />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 min-w-[200px] z-50"
                >
                  <div className="px-3 py-2 border-b border-gray-600">
                    <p className="text-white text-sm font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-gray-400 text-xs">{profile?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded transition-colors text-sm"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      
      <nav className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="max-w-md mx-auto flex justify-around">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? 'text-purple-400 bg-purple-400/10'
                  : 'text-gray-400 hover:text-gray-300'
              }`
            }
          >
            <Heart size={24} className="mb-1" />
            <span className="text-xs font-medium">Feed</span>
          </NavLink>
          
          <NavLink
            to="/companion"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? 'text-purple-400 bg-purple-400/10'
                  : 'text-gray-400 hover:text-gray-300'
              }`
            }
          >
            <MessageCircle size={24} className="mb-1" />
            <span className="text-xs font-medium">Companion</span>
          </NavLink>
        </div>
      </nav>

      {/* Click outside to close profile */}
      {showProfile && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfile(false)}
        />
      )}
    </div>
  )
}