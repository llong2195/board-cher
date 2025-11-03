import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Navigation Component (T225)
 * User Story 6: Card Assignment and Notifications
 *
 * Navigation sidebar with link to "Assigned to me" page.
 * Shows badge with count of assigned cards.
 */

export function Navigation() {
  const location = useLocation();
  const [assignedCardCount, setAssignedCardCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAssignedCardCount();
  }, []);

  const loadAssignedCardCount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/cards/assigned-to-me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: 1,
            limit: 1, // Only need count
          },
        },
      );

      setAssignedCardCount(response.data.pagination.total || 0);
    } catch (err) {
      console.error('Failed to load assigned card count:', err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    {
      path: '/boards',
      label: 'Boards',
      icon: Home,
    },
    {
      path: '/assigned-to-me',
      label: 'Assigned to me',
      icon: CheckSquare,
      badge: assignedCardCount > 0 ? assignedCardCount : undefined,
    },
    {
      path: '/organizations',
      label: 'Organizations',
      icon: Users,
    },
  ];

  return (
    <nav className="w-64 bg-white border-r min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  }`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {loading && (
        <div className="mt-4 text-xs text-gray-500 text-center">Loading card count...</div>
      )}

      {/* Notifications section (placeholder for future enhancement) */}
      <div className="mt-8 pt-8 border-t">
        <button className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full transition-colors">
          <Bell className="h-5 w-5" />
          <span>Notifications</span>
        </button>
      </div>
    </nav>
  );
}
