import React, { useState, useEffect } from 'react';
import KnowledgeGraph from './KnowledgeGraph';
import './GraphView.css';

const GraphView = ({ chatMessages, connectedToNeo4j }) => {
  const [query, setQuery] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [lastDetectedQuery, setLastDetectedQuery] = useState('');

  // 验证Neo4j连接状态
  useEffect(() => {
    const verifyConnection = async () => {
      try {
        // 尝试导入Neo4jService (避免循环依赖)
        const Neo4jService = await import('../../services/Neo4jService').then(module => module.default);
        
        // 使用最简单的查询测试连接
        await Neo4jService.executeQuery("MATCH (n) RETURN count(n) AS count LIMIT 1");
        console.log("成功连接到Neo4j数据库");
        setConnectionStatus(true);
      } catch (error) {
        console.error("Neo4j连接验证失败:", error);
        setConnectionStatus(false);
      }
    };

    // 如果提供了外部状态使用它，否则验证连接
    if (connectedToNeo4j !== undefined) {
      setConnectionStatus(connectedToNeo4j);
    } else {
      verifyConnection();
    }
  }, [connectedToNeo4j]);

  // 监听聊天消息以自动提取查询
  useEffect(() => {
    if (autoDetect && chatMessages && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      
      // 只处理AI回复
      if (!lastMessage.isUser) {
        const extractedQuery = extractMedicalQuery(lastMessage.text);
        if (extractedQuery && extractedQuery !== lastDetectedQuery) {
          setQuery(extractedQuery);
          setShowGraph(true);
          setLastDetectedQuery(extractedQuery);
        }
      }
    }
  }, [chatMessages, autoDetect, lastDetectedQuery]);

  // 从文本中提取医疗相关查询
  const extractMedicalQuery = (text) => {
    // 提取关键医疗术语的简单逻辑
    const medicalTerms = [
      '糖尿病', '高血压', '肺炎', '心脏病', '癌症', '哮喘', '头痛', '发热',
      'diabetes', 'hypertension', 'pneumonia', 'heart disease', 'cancer', 'asthma'
    ];
    
    // 查找文本中的医疗术语
    for (const term of medicalTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        return term;
      }
    }
    
    // 也尝试匹配特定的问句模式
    const patterns = [
      /什么是([\u4e00-\u9fa5]+)(病|症)/,  // 匹配"什么是XX病"或"什么是XX症"
      /([\u4e00-\u9fa5]+)(病|症)的症状/,   // 匹配"XX病的症状"
      /([\u4e00-\u9fa5]+)(病|症)的治疗/    // 匹配"XX病的治疗"
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1] + (match[2] || '');
      }
    }
    
    return null;
  };

  // 处理手动搜索
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowGraph(true);
    }
  };

  // 切换自动检测
  const toggleAutoDetect = () => {
    setAutoDetect(!autoDetect);
  };

  return (
    <div className="graph-view-container">
      <div className="graph-header">
        <h2>医疗知识图谱</h2>
        <div className={`connection-status ${connectionStatus ? 'connected' : 'disconnected'}`}>
          {connectionStatus ? '已连接' : '未连接'}
        </div>
      </div>
      
      <div className="graph-content">
        <div className="search-container">
          <form className="graph-search-form" onSubmit={handleSearch}>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索医疗概念..." 
              className="graph-search-input"
            />
            <button 
              type="submit" 
              className="graph-search-button"
              disabled={!query.trim()}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>
        
        <div className="graph-tools">
          <div className="auto-detect-toggle modern-toggle">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={autoDetect} 
                onChange={toggleAutoDetect} 
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-text">自动检测</span>
          </div>
          
          <div className="graph-filters">
            <button className="filter-button active">
              <span className="filter-dot disease"></span>
              疾病
            </button>
            <button className="filter-button active">
              <span className="filter-dot symptom"></span>
              症状
            </button>
            <button className="filter-button active">
              <span className="filter-dot treatment"></span>
              治疗
            </button>
            <button className="filter-button active">
              <span className="filter-dot cause"></span>
              病因
            </button>
          </div>
        </div>
        
        <div className="graph-visualization-container">
          {/* 空状态 */}
          {!showGraph ? (
            <div className="graph-empty-state">
              <h2>Ask Thinking Bio</h2>
              <p>在搜索框中输入医疗概念，例如"糖尿病"、"高血压"等</p>
              <p>或者开启自动检测，从聊天中提取医疗概念</p>
            </div>
          ) : (
            <>
              {/* 知识图谱组件 */}
              <KnowledgeGraph 
                query={query} 
                isConnected={connectionStatus}
              />
              
              {/* 使用提示 */}
              {connectionStatus && query && (
                <div className="graph-info-tip">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>使用鼠标拖动可移动图谱，滚轮可缩放视图</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphView;