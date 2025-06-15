import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UserCircleIcon,
  HeartIcon,
  ShoppingBagIcon,
  ChatBubbleLeftIcon,
  CubeIcon,
  ArchiveBoxIcon,
  TicketIcon,
  ShoppingCartIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

export default function DashboardLayout({ children, isAdmin }) {  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const userMenuItems = [
    { name: 'Profile', path: '/dashboard/user/profile', icon: UserCircleIcon },
    { name: 'Favorites', path: '/dashboard/user/favorites', icon: HeartIcon },
    { name: 'Orders', path: '/dashboard/user/orders', icon: ShoppingBagIcon },
    { name: 'Comments', path: '/dashboard/user/comments', icon: ChatBubbleLeftIcon },
  ];
  const adminMenuItems = [
    { name: 'Products', path: '/dashboard/admin/products', icon: CubeIcon },
    { name: 'Stock', path: '/dashboard/admin/stock', icon: ArchiveBoxIcon },
    { name: 'Coupons', path: '/dashboard/admin/coupons', icon: TicketIcon },
    { name: 'Orders', path: '/dashboard/admin/orders', icon: ShoppingCartIcon },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;
  // Ensure proper active state for nested paths
  const isMenuItemActive = (path) => {
    // Normalize paths for comparison
    const normalizedPath = path.endsWith('/') ? path : path + '/';
    const normalizedCurrentPath = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
    
    if (path === '/dashboard/admin/') {
      return normalizedCurrentPath === '/dashboard/admin/';
    }
    return normalizedCurrentPath.startsWith(normalizedPath);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          bg-white dark:bg-gray-800 shadow-lg 
          transition-all duration-300 ease-in-out
          fixed h-full
          z-30
        `}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h2 className={`font-semibold text-gray-800 dark:text-white transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 w-0' : 'opacity-100'}`}>
            {isAdmin ? 'Admin Panel' : 'Dashboard'}
          </h2>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isSidebarOpen ? (
              <ChevronDoubleLeftIcon className="w-6 h-6" />
            ) : (
              <ChevronDoubleRightIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMenuItemActive(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center px-6 py-4 text-gray-700 dark:text-gray-200
                  transition-colors duration-200
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                  ${!isSidebarOpen ? 'justify-center' : ''}
                `}
                title={!isSidebarOpen ? item.name : ''}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span 
                  className={`
                    ml-4 font-medium
                    transition-all duration-200
                    ${!isSidebarOpen ? 'hidden opacity-0 w-0' : 'opacity-100'}
                  `}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`
        flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900
        transition-all duration-300
        ${isSidebarOpen ? 'ml-64' : 'ml-20'}
        p-8
      `}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
