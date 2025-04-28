// Logo.jsx - 改进版本
import { useRef, useEffect, useState } from 'react';
import MessageInput from './MessageInput';
import './Logo.css';

const Logo = ({ animationState }) => {
  const [logoAnimationState, setLogoAnimationState] = useState('initial');
  const [chatState, setChatState] = useState('hidden'); // 'hidden', 'input', 'responding'
  const [userMessage, setUserMessage] = useState('');
  const [response, setResponse] = useState('');
  const [logoText, setLogoText] = useState("Thinking Bio"); // 初始Logo文本
  
  const logoRef = useRef(null);
  const responseRef = useRef(null);
  
  // 根据传入的animationState设置Logo动画状态
  useEffect(() => {
    if (animationState === 'animating') {
      setLogoAnimationState('animating');
    } else if (animationState === 'complete') {
      setLogoAnimationState('complete');
      // 动画完成后显示输入
      setTimeout(() => {
        setChatState('input');
      }, 1000);
    }
  }, [animationState]);
  
  // 处理用户消息提交
  const handleSendMessage = (message) => {
    setUserMessage(message);
    setChatState('responding');
    
    // 显示Logo旋转动画
    setLogoAnimationState('thinking');
    
    // 准备动画：文字上移
    setTimeout(() => {
      setLogoAnimationState('text-moving');
    }, 500);
    
    // 模拟AI响应延迟
    setTimeout(() => {
      // 模拟AI响应
      const aiResponse = `我收到了你的问题: "${message}"。这里是一个简洁的回答，您好！有什么我可以帮助您的吗？`;
      
      // 逐字显示响应
      let i = 0;
      const interval = setInterval(() => {
        setResponse(aiResponse.substring(0, i));
        i++;
        if (i > aiResponse.length) {
          clearInterval(interval);
          setTimeout(() => {
            // 重置为输入状态，准备下一次对话
            setChatState('input');
            setLogoAnimationState('moved-top');
            setResponse("");
          }, 3000);
        }
      }, 50);
    }, 1500);
  };
  
  // 根据动画状态决定应用哪些CSS类
  const getLogoClasses = () => {
    let classes = 'logo-container';
    
    switch(logoAnimationState) {
      case 'initial':
        classes += ' initial';
        break;
      case 'animating':
        classes += ' animating';
        break;
      case 'complete':
        classes += ' complete';
        break;
      case 'thinking':
        classes += ' thinking';
        break;
      case 'text-moving':
        classes += ' text-moving';
        break;
      case 'moved-top':
        classes += ' moved-top';
        break;
      default:
        break;
    }
    
    return classes;
  };
  
  // 渲染字母，添加动画延迟
  const renderLetters = () => {
    if (!logoText) return null;
    
    return logoText.split('').map((letter, index) => {
      const delay = `${index * 120}ms`;
      
      return (
        <span 
          key={index} 
          className="logo-letter"
          style={{ animationDelay: delay }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      );
    });
  };
  
  // 渲染响应字母，添加逐字显示效果
  const renderResponseLetters = () => {
    if (!response) return null;
    
    return response.split('').map((letter, index) => {
      const delay = `${index * 30}ms`;
      
      return (
        <span 
          key={index} 
          className="response-letter"
          style={{ animationDelay: delay }}
        >
          {letter}
        </span>
      );
    });
  };

  // 渲染思考图标
  const renderThinkingIcon = () => (
    <div className="response-thinking-icon">
      <svg 
        width="30" 
        height="30" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="18" stroke="#646cff" strokeWidth="2" />
        <path d="M12 20L18 26L28 16" stroke="#646cff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );

  // 渲染额外的输入按钮
  const renderExtraButtons = () => (
    <div className="input-extra-buttons">
      <button className="input-extra-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className="input-extra-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 17L17 7M7 7H17V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
  
  return (
    <div className="logo-chat-container">
      <div ref={logoRef} className={getLogoClasses()}>
        <div className="logo-icon">
          {/* 图标 */}
          <svg 
            className="logo-svg" 
            width="90" 
            height="90" 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="18" stroke="#646cff" strokeWidth="2" />
            <path d="M12 20L18 26L28 16" stroke="#646cff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        
        <h1 className="logo-text">
          {renderLetters()}
        </h1>
      </div>
      
      {/* 响应文本区域 */}
      {chatState === 'responding' && (
        <div className="response-container">
          {renderThinkingIcon()}
          <div className="response-bubble">
            <div className="response-text">
              {renderResponseLetters()}
            </div>
          </div>
        </div>
      )}
      
      {/* 消息输入区域，类似于Gemini设计 */}
      {(chatState === 'input' || chatState === 'responding') && (
        <div className="chat-input-container">
          <div className="message-input-wrapper">
            <MessageInput 
              onSendMessage={handleSendMessage} 
              isLoading={chatState === 'responding'} 
              extraButtons={renderExtraButtons()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;