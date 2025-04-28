import React from 'react';
import './KnowledgeGraph.css';
import Neo4jGraphVisualization from '../Neo4jGraphVisualization';

// Neo4j连接配置
const NEO4J_CONFIG = {
  NEO4J_URI: 'bolt://localhost:7687',
  NEO4J_USER: 'neo4j',
  NEO4J_PASSWORD: 'fyz040913',
  NEO4J_DATABASE: 'neo4j'
};

const KnowledgeGraph = ({ query, isConnected = false }) => {
  // 渲染没有连接时的提示
  const renderNoConnectionState = () => {
    return (
      <div className="no-connection-state">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="#ef4444" fill="none" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>未连接到Neo4j数据库</h3>
        <p>无法加载知识图谱。请确保Neo4j服务正在运行，并检查连接配置。</p>
      </div>
    );
  };

  // 如果未连接，显示错误信息
  if (!isConnected) {
    return renderNoConnectionState();
  }

  // 如果没有查询词，显示空状态信息
  if (!query) {
    return (
      <div className="graph-empty">
        <p>请搜索医疗概念以查看相关知识图谱</p>
      </div>
    );
  }

  // 根据查询词生成初始查询类型
  const getInitialQueryType = () => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('糖尿病')) {
      return 'diabetes';
    } else if (lowerQuery.includes('食物') || lowerQuery.includes('饮食')) {
      return 'food';
    } else if (lowerQuery.includes('疾病')) {
      return 'disease';
    } else {
      return 'relationships';
    }
  };

  // 使用我们的新组件
  return (
    <div className="knowledge-graph-container">
      <Neo4jGraphVisualization 
        serverUrl={NEO4J_CONFIG.NEO4J_URI}
        serverUser={NEO4J_CONFIG.NEO4J_USER}
        serverPassword={NEO4J_CONFIG.NEO4J_PASSWORD}
        database={NEO4J_CONFIG.NEO4J_DATABASE}
        initialQueryType={getInitialQueryType()}
        initialSearchTerm={query}
      />
    </div>
  );
};

export default KnowledgeGraph;
