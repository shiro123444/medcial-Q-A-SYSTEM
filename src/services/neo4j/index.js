// 导出Neo4j连接和基本查询
import {
  NEO4J_CONFIG,
  initNeo4jConnection,
  executeQuery,
  getDriver,
  closeConnection
} from './Neo4jConnection';

// 导出数据处理函数
import {
  processNeo4jResult,
  formatContextForLLM,
  isIncompleteResult
} from './Neo4jProcessor';

// 导出查询构建函数
import {
  generateMedicalCypher,
  extractMedicalTerms,
  generateEnhancedQuery,
  generateFallbackQuery,
  suggestQueryCorrections,
  generateSuggestedQueries
} from './Neo4jQueryBuilder';

// 导出可视化函数
import {
  formatForVisualization,
  formatNodeTooltip,
  collectGraphMetadata
} from './Neo4jVisualizer';

// 导出增强函数
import {
  getEnhancedNeo4jContext,
  getRelevantContext
} from './Neo4jEnhanced';

// 创建Neo4j服务对象
const Neo4jService = {
  // 连接管理
  NEO4J_CONFIG,
  initNeo4jConnection,
  executeQuery,
  getDriver,
  closeConnection,
  
  // 查询生成
  generateMedicalCypher,
  extractMedicalTerms,
  
  // 结果处理
  processNeo4jResult,
  formatContextForLLM,
  
  // 可视化
  formatForVisualization,
  
  // 主要导出函数
  getVisualGraph: async (query) => {
    try {
      // 分析查询，提取关键医疗实体和关系
      const cypher = generateMedicalCypher(query);
      
      // 执行查询
      const result = await executeQuery(cypher);
      const processedResult = processNeo4jResult(result);
      
      // 格式化结果用于可视化
      return formatForVisualization(processedResult);
    } catch (error) {
      console.error('获取知识图谱数据失败:', error);
      return { nodes: [], edges: [] };
    }
  },
  
  // 增强功能
  getEnhancedNeo4jContext,
  getRelevantContext
};

export default Neo4jService;

// 为方便单独导入，也导出各个具体函数
export {
  NEO4J_CONFIG,
  initNeo4jConnection,
  executeQuery,
  getDriver,
  closeConnection,
  generateMedicalCypher,
  extractMedicalTerms,
  processNeo4jResult,
  formatContextForLLM,
  formatForVisualization,
  getEnhancedNeo4jContext,
  getRelevantContext
};
