import { useState, useEffect } from 'react';

// Simple icon components
const MenuIcon = ({ size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" fill="none" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const HistoryIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" fill="none" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const GraphIcon = ({ size = 20, active = false }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke={active ? "#646cff" : "currentColor"} fill="none" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const FullscreenIcon = ({ size = 20, isFullscreen = false }) => (
  isFullscreen ? (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" fill="none" strokeWidth="2">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" fill="none" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
    </svg>
  )
);

function Navbar({ animationState, onMobileMenuToggle, activeView, onSwitchView }) {
  const [activeItem, setActiveItem] = useState(null);
  const [navItems, setNavItems] = useState([]);

  // Menu items
  const menuItems = [
    { id: 'chat', label: 'Chat' },
    { id: 'graph', label: 'Graph' },
    { id: 'api', label: 'API' }
  ];

  // Use useEffect to implement staggered menu item animation
  useEffect(() => {
    if (animationState === 'complete') {
      // Delay loading each menu item to create a staggered effect
      const delay = 120;
      setNavItems([]);
      menuItems.forEach((item, index) => {
        setTimeout(() => {
          setNavItems(prev => [...prev, item]);
        }, index * delay);
      });
    } else {
      setNavItems([]);
    }
  }, [animationState]);

  return (
    <nav className={`navbar ${animationState === 'complete' ? 'visible' : ''}`}>
      <div className="mobile-menu-icon" onClick={onMobileMenuToggle}>
        <MenuIcon size={24} />
      </div>
      
      <div className="nav-left">
        {navItems.map((item, index) => (
          <div 
            key={item.id} 
            className={`nav-item ${activeItem === item.id ? 'active' : ''} fade-in`}
            onClick={() => setActiveItem(item.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {item.label}
            <span className="nav-hover-effect"></span>
          </div>
        ))}
      </div>
      
      <div className="nav-left">
        {navItems.map((item, index) => (
          <div 
            key={item.id} 
            className={`nav-item ${activeItem === item.id ? 'active' : ''} fade-in`}
            onClick={() => setActiveItem(item.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {item.label}
            <span className="nav-hover-effect"></span>
          </div>
        ))}
      </div>
      
      <div className="nav-right">
        {/* 视图切换按钮 */}
        <div className="view-switcher fade-in" style={{ animationDelay: '0.3s' }}>
          <button 
            className={`view-button ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => onSwitchView('chat')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>聊天</span>
          </button>
          
          <button 
            className={`view-button ${activeView === 'graph' ? 'active' : ''}`}
            onClick={() => onSwitchView('graph')}
          >
            <GraphIcon size={18} active={activeView === 'graph'} />
            <span>知识图谱</span>
          </button>
        </div>
        
        {/* History button */}
        <div 
          className={`nav-item fade-in ${animationState === 'complete' ? 'visible' : ''}`} 
          style={{ animationDelay: '0.4s' }}
        >
          <HistoryIcon size={20} />
          <span className="nav-tooltip">History</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;