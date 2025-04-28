import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import './ChatBox.css';

const ChatBox = ({ isVisible, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: '👋 你好！我是Thinking Bio助手，有什么我可以帮助你的吗？',
      timestamp: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isVisible) {
      scrollToBottom();
    }
  }, [messages, isVisible]);

  // 处理发送消息
  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    
    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    // 模拟AI回复延迟
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `我收到了你的消息: "${content}"。这是一个模拟的回复，在实际应用中，这里应该调用您的API来获取真实的AI回应。`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className="chat-box-overlay">
      <div className="chat-box-container" ref={containerRef}>
        <div className="chat-box-header">
          <h2>Thinking Bio</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="messages-container">
          {messages.map(message => (
            <MessageBubble 
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
          
          {loading && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <MessageInput onSendMessage={handleSendMessage} isLoading={loading} />
      </div>
    </div>
  );
};

export default ChatBox;
