import React from 'react';
import Neo4jGraphVisualization from '../components/Neo4jGraphVisualization';

const KnowledgeGraphPage = () => {
  // Neo4j连接配置
  const neo4jConfig = {
    serverUrl: 'bolt://localhost:7687',
    serverUser: 'neo4j',
    serverPassword: 'fyz040913',
    database: 'neo4j'
  };

  return (
    <div style={{ padding: '20px' }}>
      <Neo4jGraphVisualization 
        serverUrl={neo4jConfig.serverUrl}
        serverUser={neo4jConfig.serverUser}
        serverPassword={neo4jConfig.serverPassword}
        database={neo4jConfig.database}
      />
    </div>
  );
};

export default KnowledgeGraphPage;
