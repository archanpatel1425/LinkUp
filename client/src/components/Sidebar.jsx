import React from 'react';
import { FaHome, FaCalendar, FaHistory, FaVideo, FaUserPlus, FaTimes, FaCog } from 'react-icons/fa'; // FaCog added for Settings

const Sidebar = ({ isOpen, toggleSidebar, setActiveComponent, isMobile }) => {
  const menuItems = [
    { icon: FaHome, text: 'Home', component: 'Home' },/* 
    { icon: FaCalendar, text: 'Upcoming', component: 'Upcoming' },
    { icon: FaHistory, text: 'Previous', component: 'Previous' },
    { icon: FaVideo, text: 'Recordings', component: 'Recordings' }, */
    { icon: FaUserPlus, text: 'Personal Room', component: 'PersonalRoom' },
    { icon: FaCog, text: 'Settings', component: 'Settings' }, // New Settings menu item
  ];

  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-0 w-64 bg-gray-800 text-white transform mt-16 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`
    : 'fixed inset-y-0 left-0 w-64 bg-gray-800 text-white mt-16'; // Added mt-16 to shift the sidebar down

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          {isMobile && (
            <button onClick={toggleSidebar} className="text-white">
              <FaTimes size={24} />
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2 p-4">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    setActiveComponent(item.component);
                    if (isMobile) {
                      toggleSidebar();
                    }
                  }}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 w-full text-left"
                >
                  <item.icon /> <span>{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
