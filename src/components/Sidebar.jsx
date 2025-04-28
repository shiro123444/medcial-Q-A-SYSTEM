import React, { useEffect, useState } from 'react';
import { ExpandableTabs } from './ui/expandable-tabs';
import './Sidebar.css';

// Simple icon components to avoid external dependencies
const IconComponents = {
  Home: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  MessageCircle: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  ),
  Chart: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  FileText: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  Users: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Settings: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  Help: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  Book: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  ),
  Search: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Menu: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  X: (props) => (
    <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} stroke="currentColor" fill="none" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

const Sidebar = ({ animationState, isMobileOpen, onMobileClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    if (animationState === 'complete') {
      // Delay the sidebar appearance until after the logo animation completes
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [animationState]);
  
  const mainTabs = [
    { title: "Home", icon: IconComponents.Home },
    { title: "Chat", icon: IconComponents.MessageCircle },
    { title: "Analytics", icon: IconComponents.Chart },
    { type: "separator" },
    { title: "Documents", icon: IconComponents.FileText },
    { title: "Community", icon: IconComponents.Users },
  ];
  
  const utilityTabs = [
    { title: "Settings", icon: IconComponents.Settings },
    { title: "Help", icon: IconComponents.Help },
    { title: "Knowledge Base", icon: IconComponents.Book },
  ];
  
  const handleTabChange = (index) => {
    console.log("Selected tab:", index);
    // Implement any tab change logic here
  };
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Only render if visible
  if (!isVisible) return null;
  
  return (
    <div 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease'
      }}
    >
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <svg 
              className="sidebar-logo" 
              width="30" 
              height="30" 
              viewBox="0 0 40 40" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="20" cy="20" r="18" stroke="#646cff" strokeWidth="2" />
              <path d="M12 20L18 26L28 16" stroke="#646cff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {!isCollapsed && <span className="sidebar-title">Thinking Bio</span>}
          </div>
          
          <button 
            className="collapse-toggle" 
            onClick={isCollapsed ? toggleSidebar : (isMobileOpen ? onMobileClose : toggleSidebar)}
          >
            {isCollapsed ? <IconComponents.Menu size={18} /> : <IconComponents.X size={18} />}
          </button>
          
          {!isCollapsed && (
            <div className="sidebar-search">
              <div className="search-icon">
                <IconComponents.Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
                className="search-input"
              />
            </div>
          )}
        </div>
        
        <div className="sidebar-section">
          {!isCollapsed && <h3 className="sidebar-section-title">Main</h3>}
          <ExpandableTabs 
            tabs={mainTabs} 
            className={`sidebar-tabs ${isCollapsed ? 'collapsed-tabs' : ''}`}
            activeColor="text-indigo-500"
            onChange={handleTabChange}
          />
        </div>
        
        <div className="sidebar-section">
          {!isCollapsed && <h3 className="sidebar-section-title">Utilities</h3>}
          <ExpandableTabs 
            tabs={utilityTabs} 
            className={`sidebar-tabs ${isCollapsed ? 'collapsed-tabs' : ''}`}
            activeColor="text-sky-500"
            onChange={handleTabChange}
          />
        </div>
        
        {!isCollapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-version">
              v0.1.0
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;