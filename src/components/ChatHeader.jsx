import React from 'react';
import ModelSelector from './ModelSelector';
import './ChatHeader.css';

const ChatHeader = ({ 
  availableModels, 
  currentModel, 
  onModelChange,
  isConnected,
  isLoading,
  onClearChat,
  serviceType = 'ollama', // 默认为 ollama
  onServiceTypeChange, // 服务类型改变回调
  deepseekApiKey, // DeepSeek API Key
  onDeepseekApiKeyChange // DeepSeek API Key 改变回调
}) => {
  // Determine the connection status indicator color
  const getStatusColor = () => {
    if (isLoading) return 'yellow';
    return isConnected ? 'green' : 'red';
  };

  // Handle clear chat with confirmation
  const handleClearChat = () => {
    if (window.confirm('确定要清除所有消息吗？')) {
      // Clear localStorage and call the onClearChat callback
      localStorage.removeItem('chat-messages');
      onClearChat();
    }
  };

  // 获取服务状态文本
  const getStatusText = () => {
    if (isLoading) return '处理中...';
    if (serviceType === 'ollama') {
      return isConnected ? '已连接到 Ollama' : 'Ollama 未连接';
    } else {
      return isConnected ? '已连接到 DeepSeek' : 'DeepSeek 未连接';
    }
  };

  return (
    <div className="chat-header">
      <div className="chat-title">
        <h1>Thinking Bio</h1>
        <div className="chat-subtitle">
          <div className={`status-indicator ${getStatusColor()}`}></div>
          <span>{getStatusText()}</span>
        </div>
      </div>
      <div className="chat-controls">
        <div className="model-selection">
          <ModelSelector
            availableModels={availableModels}
            currentModel={currentModel}
            onModelChange={onModelChange}
            isConnected={isConnected}
            serviceType={serviceType}
            onServiceTypeChange={onServiceTypeChange}
            deepseekApiKey={deepseekApiKey}
            onDeepseekApiKeyChange={onDeepseekApiKeyChange}
          />
        </div>
        <button 
          className="clear-chat-button"
          onClick={handleClearChat}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span>清除对话</span>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;