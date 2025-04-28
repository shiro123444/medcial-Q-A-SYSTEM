import React, { useState, useEffect, useRef } from 'react';
import './ModelSelector.css';

const ModelSelector = ({
  availableModels,
  currentModel,
  onModelChange,
  isConnected,
  serviceType, // 'ollama' 或 'deepseek'
  onServiceTypeChange, // 服务类型改变回调
  deepseekApiKey, // DeepSeek API Key
  onDeepseekApiKeyChange, // DeepSeek API Key 改变回调
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(deepseekApiKey || '');
  const dropdownRef = useRef(null);
  
  // 关闭下拉菜单的点击外部事件处理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理模型选择
  const handleModelSelect = (model) => {
    onModelChange(model);
    setIsOpen(false);
  };

  // 处理服务类型切换
  const handleServiceTypeChange = (type) => {
    onServiceTypeChange(type);
    setIsOpen(false);
    
    // 如果切换到 DeepSeek 且没有 API Key，显示输入框
    if (type === 'deepseek' && !deepseekApiKey) {
      setShowApiKeyInput(true);
    } else {
      setShowApiKeyInput(false);
    }
  };

  // 处理 API Key 提交
  const handleApiKeySubmit = () => {
    onDeepseekApiKeyChange(apiKey);
    setShowApiKeyInput(false);
  };

  return (
    <div className={`model-selector ${className}`} ref={dropdownRef}>
      <button 
        className="model-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!isConnected && serviceType === 'ollama'}
      >
        <div className="model-info">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span className="service-name">{serviceType === 'ollama' ? 'Ollama' : 'DeepSeek'}</span>
          <span className="model-name">{currentModel}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          <div className="service-selector">
            <button 
              className={`service-option ${serviceType === 'ollama' ? 'selected' : ''}`}
              onClick={() => handleServiceTypeChange('ollama')}
            >
              Ollama (本地)
            </button>
            <button 
              className={`service-option ${serviceType === 'deepseek' ? 'selected' : ''}`}
              onClick={() => handleServiceTypeChange('deepseek')}
            >
              DeepSeek API
            </button>
          </div>
          
          <div className="models-list">
            {serviceType === 'ollama' ? (
              isConnected ? (
                availableModels.length > 0 ? (
                  availableModels.map(model => (
                    <button
                      key={model}
                      className={`model-option ${model === currentModel ? 'selected' : ''}`}
                      onClick={() => handleModelSelect(model)}
                    >
                      {model}
                    </button>
                  ))
                ) : (
                  <div className="no-models-message">未找到模型</div>
                )
              ) : (
                <div className="not-connected-message">Ollama 未连接</div>
              )
            ) : (
              // DeepSeek 模型列表
              deepseekApiKey ? (
                availableModels.length > 0 ? (
                  availableModels.map(model => (
                    <button
                      key={model}
                      className={`model-option ${model === currentModel ? 'selected' : ''}`}
                      onClick={() => handleModelSelect(model)}
                    >
                      {model}
                    </button>
                  ))
                ) : (
                  <div className="no-models-message">未找到 DeepSeek 模型</div>
                )
              ) : (
                <div className="api-key-prompt">
                  <button onClick={() => setShowApiKeyInput(true)}>
                    设置 DeepSeek API Key
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {showApiKeyInput && (
        <div className="api-key-modal">
          <div className="api-key-content">
            <h3>输入 DeepSeek API Key</h3>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-***************"
              autoFocus
            />
            <div className="api-key-actions">
              <button onClick={() => setShowApiKeyInput(false)}>取消</button>
              <button onClick={handleApiKeySubmit} disabled={!apiKey.trim()}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;