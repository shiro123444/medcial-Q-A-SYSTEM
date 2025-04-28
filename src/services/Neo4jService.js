// 引入拆分后的模块化服务
import Neo4jService from './neo4j';

// 为了向后兼容，导出所有Neo4j服务函数
export const {
  NEO4J_CONFIG,
  initNeo4jConnection,
  executeQuery,
  generateMedicalCypher,
  extractMedicalTerms,
  getVisualGraph,
  getRelevantContext,
  getEnhancedNeo4jContext
} = Neo4jService;

// 为了向后兼容，导出默认服务对象
export default Neo4jService;
