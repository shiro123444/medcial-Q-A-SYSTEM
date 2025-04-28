// App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import GraphView from './components/knowledge-graph/GraphView';

function App() {
  const [animationState, setAnimationState] = useState('initial');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // 'chat' 或 'graph'
  const [chatMessages, setChatMessages] = useState([]);
  const [isConnectedToNeo4j, setIsConnectedToNeo4j] = useState(true); // 模拟连接状态

  useEffect(() => {
    // 跳过初始动画，直接到完成状态
    setAnimationState('complete');
    
    // 显示侧边栏
    const timer = setTimeout(() => {
      setSidebarVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 处理移动端侧边栏切换
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // 关闭移动端侧边栏
  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // 切换视图 (聊天/图谱)
  const switchView = (view) => {
    setActiveView(view);
  };

  // 更新聊天消息以供图谱分析
  const handleChatMessagesUpdate = (messages) => {
    setChatMessages(messages);
  };

  // 监听窗口大小变化，在大屏幕上关闭移动端侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileSidebarOpen]);

  return (
    <div className={`app-container ${sidebarVisible ? 'sidebar-visible' : ''}`}>
      <Sidebar 
        animationState={animationState} 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      
      {/* 移动端侧边栏遮罩 */}
      <div 
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'visible' : ''}`}
        onClick={closeMobileSidebar}
      ></div>
      
      <Navbar 
        animationState={animationState} 
        onMobileMenuToggle={toggleMobileSidebar}
        activeView={activeView}
        onSwitchView={switchView}
      />
      
      <main className="main-content">
        {activeView === 'chat' ? (
          <ChatContainer 
            onMessagesUpdate={handleChatMessagesUpdate}
          />
        ) : (
          <GraphView 
            chatMessages={chatMessages}
            connectedToNeo4j={isConnectedToNeo4j}
          />
        )}
      </main>
    </div>
  );
}

export default App;