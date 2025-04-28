import neo4j from 'neo4j-driver';

// Neo4j连接配置
export const NEO4J_CONFIG = {
  NEO4J_URI: 'bolt://localhost:7687', // 修改为bolt协议
  NEO4J_USER: 'neo4j',
  NEO4J_PASSWORD: 'fyz040913',
  NEO4J_DATABASE: 'neo4j' // 默认数据库名
};

// 创建Neo4j驱动实例
let driver;

/**
 * 初始化Neo4j连接
 * @returns {object} Neo4j驱动实例
 */
export function initNeo4jConnection() {
  if (!driver) {
    try {
      driver = neo4j.driver(
        NEO4J_CONFIG.NEO4J_URI,
        neo4j.auth.basic(NEO4J_CONFIG.NEO4J_USER, NEO4J_CONFIG.NEO4J_PASSWORD),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3小时
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2000, // 连接获取超时（毫秒）
        }
      );
      console.log('Neo4j连接初始化成功');
    } catch (error) {
      console.error('Neo4j连接初始化失败:', error);
      throw error;
    }
  }
  return driver;
}

/**
 * 执行Cypher查询
 * @param {string} cypher - Cypher查询语句
 * @param {object} params - 查询参数
 * @returns {Promise<object>} - 查询结果
 */
export async function executeQuery(cypher, params = {}) {
  if (!driver) {
    try {
      initNeo4jConnection();
    } catch (error) {
      console.error('无法连接到Neo4j:', error);
      throw new Error('Neo4j连接失败');
    }
  }

  const session = driver.session({
    database: NEO4J_CONFIG.NEO4J_DATABASE,
  });

  try {
    console.log(`执行查询: ${cypher}`);
    const result = await session.run(cypher, params);
    return result;
  } catch (error) {
    console.error('Neo4j查询执行失败:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * 获取Neo4j驱动以便高级操作
 * @returns {object} Neo4j驱动实例
 */
export function getDriver() {
  if (!driver) {
    initNeo4jConnection();
  }
  return driver;
}

/**
 * 关闭Neo4j连接
 */
export async function closeConnection() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j连接已关闭');
  }
}
