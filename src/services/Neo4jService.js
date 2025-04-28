import neo4j from 'neo4j-driver';

// Neo4j连接配置
const NEO4J_URI = 'bolt://localhost:7687'; // 修改为bolt协议
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'fyz040913';
const NEO4J_DATABASE = 'neo4j'; // 默认数据库名

// 导出配置供其他模块使用
export const NEO4J_CONFIG = {
  NEO4J_URI,
  NEO4J_USER,
  NEO4J_PASSWORD,
  NEO4J_DATABASE
};

// 创建Neo4j驱动实例
let driver;

/**
 * 初始化Neo4j连接
 */
export function initNeo4jConnection() {
  if (!driver) {
    try {
      driver = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3小时
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2000, // 连接获取超时（毫秒）
        }
      );
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
    database: NEO4J_DATABASE,
  });

  try {
    const result = await session.run(cypher, params);
    return processNeo4jResult(result);
  } catch (error) {
    console.error('Neo4j查询执行失败:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * 处理Neo4j结果为更易用的格式
 * @param {object} result - Neo4j结果对象
 * @returns {object} - 处理后的数据
 */
function processNeo4jResult(result) {
  const nodes = [];
  const relationships = [];
  const nodeMap = new Map();

  try {
    // 处理记录
    if (!result || !result.records) {
      console.error("Neo4j结果不包含records字段");
      return { nodes, relationships };
    }

    result.records.forEach(record => {
      if (!record || !record._fields) return;

      record._fields.forEach(value => {
        if (!value) return;
        
        // 1. 安全处理节点
        if (neo4j.isNode(value)) {
          try {
            // 避免重复节点，使用安全的字符串转换
            const nodeId = value.identity ? value.identity.toString() : `node-${nodes.length}`;
            
            if (!nodeMap.has(nodeId)) {
              nodeMap.set(nodeId, true);
              nodes.push({
                id: nodeId,
                labels: Array.isArray(value.labels) ? value.labels : [],
                properties: value.properties || {}
              });
            }
          } catch (nodeErr) {
            console.error("处理Neo4j节点时出错:", nodeErr);
          }
        } 
        // 2. 安全处理关系
        else if (neo4j.isRelationship(value)) {
          try {
            // 安全获取ID和节点引用
            const relId = value.identity ? value.identity.toString() : `rel-${relationships.length}`;
            const startId = value.startNodeIdentity ? value.startNodeIdentity.toString() : null;
            const endId = value.endNodeIdentity ? value.endNodeIdentity.toString() : null;
            
            // 只有当起始节点和结束节点都有效时才添加关系
            if (startId && endId) {
              relationships.push({
                id: relId,
                type: value.type || 'RELATED',
                startNodeId: startId,
                endNodeId: endId,
                properties: value.properties || {}
              });
            }
          } catch (relErr) {
            console.error("处理Neo4j关系时出错:", relErr);
          }
        } 
        // 3. 安全处理路径
        else if (neo4j.isPath(value)) {
          try {
            // 检查是否有分段
            if (!value.segments || !Array.isArray(value.segments)) return;
            
            value.segments.forEach(segment => {
              if (!segment || !segment.start || !segment.end || !segment.relationship) return;
              
              // 添加起始节点（带安全检查）
              const startId = segment.start.identity ? segment.start.identity.toString() : `node-start-${nodes.length}`;
              if (!nodeMap.has(startId) && segment.start) {
                nodeMap.set(startId, true);
                nodes.push({
                  id: startId,
                  labels: Array.isArray(segment.start.labels) ? segment.start.labels : [],
                  properties: segment.start.properties || {}
                });
              }
              
              // 添加关系（带安全检查）
              const relId = segment.relationship.identity ? 
                segment.relationship.identity.toString() : `rel-path-${relationships.length}`;
              
              if (segment.relationship) {
                relationships.push({
                  id: relId,
                  type: segment.relationship.type || 'RELATED',
                  startNodeId: startId,
                  endNodeId: segment.end.identity ? segment.end.identity.toString() : `node-end-${nodes.length}`,
                  properties: segment.relationship.properties || {}
                });
              }
              
              // 添加结束节点（带安全检查）
              const endId = segment.end.identity ? segment.end.identity.toString() : `node-end-${nodes.length}`;
              if (!nodeMap.has(endId) && segment.end) {
                nodeMap.set(endId, true);
                nodes.push({
                  id: endId,
                  labels: Array.isArray(segment.end.labels) ? segment.end.labels : [],
                  properties: segment.end.properties || {}
                });
              }
            });
          } catch (pathErr) {
            console.error("处理Neo4j路径时出错:", pathErr);
          }
        }
        // 4. 尝试处理普通对象，可能是Neo4j驱动的自定义类型
        else if (typeof value === 'object') {
          try {
            // 检查是否有常见的节点属性
            if (value.labels && value.properties) {
              const nodeId = value.identity ? value.identity.toString() : `node-obj-${nodes.length}`;
              if (!nodeMap.has(nodeId)) {
                nodeMap.set(nodeId, true);
                nodes.push({
                  id: nodeId,
                  labels: Array.isArray(value.labels) ? value.labels : [],
                  properties: value.properties || {}
                });
              }
            }
            // 检查是否有常见的关系属性
            else if (value.type && value.start && value.end) {
              const relId = value.identity ? value.identity.toString() : `rel-obj-${relationships.length}`;
              const startId = typeof value.start === 'string' ? value.start : `node-start-${relationships.length}`;
              const endId = typeof value.end === 'string' ? value.end : `node-end-${relationships.length}`;
              
              relationships.push({
                id: relId,
                type: value.type,
                startNodeId: startId,
                endNodeId: endId,
                properties: value.properties || {}
              });
            }
          } catch (objErr) {
            console.error("处理Neo4j对象时出错:", objErr);
          }
        }
      });
    });

    console.log(`处理完成: 发现 ${nodes.length} 个节点和 ${relationships.length} 个关系`);
    return { nodes, relationships };
  } catch (error) {
    console.error("处理Neo4j结果时出错:", error);
    return { nodes, relationships };
  }
}

/**
 * 根据自然语言查询创建知识图谱可视化数据
 * @param {string} query - 自然语言查询
 * @returns {Promise<object>} - 可视化图谱数据
 */
export async function getVisualGraph(query) {
  try {
    // 分析查询，提取关键医疗实体和关系
    const cypher = generateMedicalCypher(query);
    
    // 执行查询
    const result = await executeQuery(cypher);
    
    // 格式化结果用于可视化
    return formatForVisualization(result);
  } catch (error) {
    console.error('获取知识图谱数据失败:', error);
    return { nodes: [], relationships: [] };
  }
}

/**
 * 生成医疗相关的Cypher查询语句
 * @param {string} query - 自然语言查询
 * @returns {string} - Cypher查询语句
 */
function generateMedicalCypher(query) {
  // 转换为小写便于处理
  const lowerQuery = query.toLowerCase();

  // 提取医疗实体及其类别
  const { entities, categories } = extractMedicalTerms(lowerQuery);
  
  console.log('提取的医学实体:', entities);
  console.log('实体类别:', categories);
  
  if (entities.length === 0) {
    // 如果没有识别到实体，返回一个通用查询
    return `MATCH (n)-[r]-(m) 
            RETURN n, r, m LIMIT 10`;
  }
  
  // 根据识别到的实体类别构建智能查询
  // 优先处理症状查询 - 用户更常询问的是症状
  if (categories.includes('symptoms')) {
    const symptomEntities = entities.filter(entity => {
      const symptoms = [
        '头痛', '发热', '咳嗽', '腹痛', '胸痛', '胸闷', '呕吐', '腹泻', 
        '乏力', '头晕', '心悸', '多汗', '气短', '呼吸困难', '失眠',
        '疲劳', '食欲不振', '恶心', '关节痛', '背痛', '喉咙痛', '鼻塞'
      ];
      return symptoms.includes(entity);
    });
    
    // 构建症状相关查询
    if (symptomEntities.length > 0) {
      const symptomConditions = symptomEntities.map(symptom => 
        `n.name = '${symptom}' OR n.name CONTAINS '${symptom}'`
      ).join(' OR ');
      
      // 不同类型的症状查询
      if (lowerQuery.includes('原因') || lowerQuery.includes('为什么') || lowerQuery.includes('怎么会')) {
        // 症状的原因查询
        return `MATCH (n)-[r:SYMPTOM_OF|CAUSED_BY|相关]->(m)
                WHERE (${symptomConditions})
                RETURN n, r, m
                UNION
                MATCH (d)-[r1:HAS_SYMPTOM]->(n)
                WHERE (${symptomConditions})
                MATCH (d)-[r2]-(m)
                RETURN d, r2, m
                LIMIT 20`;
      }
      
      if (lowerQuery.includes('治疗') || lowerQuery.includes('怎么办') || lowerQuery.includes('缓解')) {
        // 症状的治疗查询
        return `MATCH (s)-[r:SYMPTOM_OF]->(d)
                WHERE (${symptomConditions})
                MATCH (d)-[r2:TREATED_BY]->(t)
                RETURN s, r, d, r2, t
                LIMIT 20`;
      }
      
      // 默认症状查询 - 全面信息
      return `MATCH (n)-[r]-(m)
              WHERE (${symptomConditions})
              RETURN n, r, m LIMIT 25`;
    }
  }
  
  // 处理疾病查询
  if (categories.includes('diseases')) {
    const diseaseEntities = entities.filter(entity => {
      const diseases = [
        '糖尿病', '高血压', '癌症', '心脏病', '哮喘', '关节炎', '中风',
        '抑郁症', '焦虑症', '阿尔茨海默症', '流感', '感冒', '肺炎',
        '肝炎', '肝硬化', '胃炎', '肠炎', '支气管炎', '心肌梗塞', '胃溃疡'
      ];
      return diseases.includes(entity);
    });
    
    if (diseaseEntities.length > 0) {
      const diseaseConditions = diseaseEntities.map(disease => 
        `n.name = '${disease}' OR n.name CONTAINS '${disease}'`
      ).join(' OR ');
      
      // 根据查询内容构建特定的查询
      if (lowerQuery.includes('症状') || lowerQuery.includes('表现')) {
        return `MATCH (d)-[r:HAS_SYMPTOM]->(s)
                WHERE (${diseaseConditions})
                RETURN d, r, s LIMIT 20`;
      }
      
      if (lowerQuery.includes('治疗') || lowerQuery.includes('药物')) {
        return `MATCH (d)-[r:TREATED_BY]->(t)
                WHERE (${diseaseConditions})
                RETURN d, r, t LIMIT 20`;
      }
      
      if (lowerQuery.includes('原因') || lowerQuery.includes('病因')) {
        return `MATCH (d)-[r:CAUSED_BY]->(c)
                WHERE (${diseaseConditions})
                RETURN d, r, c LIMIT 20`;
      }
      
      if (lowerQuery.includes('吃') || lowerQuery.includes('食物') || lowerQuery.includes('饮食')) {
        return `MATCH (d)-[r:recommend_eat|SUITABLE_FOOD|DIET]->(f)
                WHERE (${diseaseConditions})
                RETURN d, r, f LIMIT 20`;
      }
      
      // 默认疾病查询 - 全面信息
      return `MATCH (n)-[r]-(m)
              WHERE (${diseaseConditions})
              RETURN n, r, m LIMIT 25`;
    }
  }
  
  // 通用实体查询 - 当没有匹配到特定类别时
  const generalConditions = entities.map(entity => 
    `n.name CONTAINS '${entity}' OR m.name CONTAINS '${entity}'`
  ).join(' OR ');
  
  return `MATCH (n)-[r]-(m)
          WHERE (${generalConditions})
          RETURN n, r, m LIMIT 20`;
}

/**
 * 从查询中提取医疗术语
 * @param {string} query - 查询文本
 * @returns {Array<string>} - 提取的医疗术语列表
 */
function extractMedicalTerms(query) {
  // 更高级的医学术语提取
  
  // 定义医学实体类别
  const medicalEntities = {
    symptoms: [
      '头痛', '发热', '咳嗽', '腹痛', '胸痛', '胸闷', '呕吐', '腹泻', 
      '乏力', '头晕', '心悸', '多汗', '气短', '呼吸困难', '失眠',
      '疲劳', '食欲不振', '恶心', '关节痛', '背痛', '喉咙痛', '鼻塞'
    ],
    diseases: [
      '糖尿病', '高血压', '癌症', '心脏病', '哮喘', '关节炎', '中风',
      '抑郁症', '焦虑症', '阿尔茨海默症', '流感', '感冒', '肺炎',
      '肝炎', '肝硬化', '胃炎', '肠炎', '支气管炎', '心肌梗塞', '胃溃疡'
    ],
    bodyParts: [
      '头', '颈', '胸', '腹', '背', '腰', '臀', '手', '脚', '关节',
      '皮肤', '心脏', '肺', '肝', '肾', '胃', '肠', '脑', '脊椎'
    ]
  };
  
  // 提取实体及其类别
  const results = {
    entities: [],
    categories: []
  };
  
  // 从查询中查找医学实体
  for (const [category, terms] of Object.entries(medicalEntities)) {
    for (const term of terms) {
      if (query.toLowerCase().includes(term.toLowerCase())) {
        results.entities.push(term);
        if (!results.categories.includes(category)) {
          results.categories.push(category);
        }
      }
    }
  }
  
  // 如果没有匹配到预定义的术语，尝试提取可能的医学术语
  if (results.entities.length === 0) {
    // 分割查询为词语，排除常见的问询词和短词
    const queryTerms = query
      .replace(/[？?!！。.,，]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length >= 2);
    
    // 排除常见的非医学词语
    const commonWords = ['什么', '怎么', '如何', '为什么', '可以', '应该', '需要', '建议'];
    
    queryTerms.forEach(term => {
      if (!commonWords.includes(term) && term.length >= 2) {
        results.entities.push(term);
        results.categories.push('unknown');
      }
    });
  }
  
  // 返回实体数组和它们的类别
  return results;
}

/**
 * 格式化数据用于可视化
 * @param {object} data - 图数据
 * @returns {object} - 格式化的可视化数据
 */
function formatForVisualization(data) {
  const { nodes, relationships } = data;
  
  // 格式化节点数据
  const formattedNodes = nodes.map(node => {
    // 确定节点颜色和大小
    let color = '#6366f1'; // 默认颜色
    let size = 30;         // 默认大小
    
    if (node.labels.includes('Disease')) {
      color = '#ef4444'; // 红色
      size = 40;
    } else if (node.labels.includes('Symptom')) {
      color = '#f59e0b'; // 橙色
      size = 35;
    } else if (node.labels.includes('Treatment')) {
      color = '#10b981'; // 绿色
      size = 35;
    } else if (node.labels.includes('Cause')) {
      color = '#8b5cf6'; // 紫色
      size = 35;
    }
    
    return {
      id: node.id,
      label: node.properties.name || node.labels[0],
      title: formatNodeTooltip(node),
      color: color,
      size: size,
      font: { size: 12, strokeWidth: 2, strokeColor: '#ffffff' },
      type: node.labels[0]
    };
  });
  
  // 格式化关系数据
  const formattedEdges = relationships.map(rel => {
    return {
      id: rel.id,
      from: rel.startNodeId,
      to: rel.endNodeId,
      label: rel.type.replace(/_/g, ' ').toLowerCase(),
      arrows: 'to',
      color: {
        color: '#9ca3af',
        highlight: '#6366f1'
      },
      title: Object.entries(rel.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join('<br>')
    };
  });
  
  return {
    nodes: formattedNodes,
    edges: formattedEdges
  };
}

/**
 * 为节点格式化工具提示
 * @param {object} node - 节点数据
 * @returns {string} - HTML格式的工具提示
 */
function formatNodeTooltip(node) {
  const titleLines = [
    `<strong>${node.properties.name || 'Unknown'}</strong>`,
    `<span>Type: ${node.labels.join(', ')}</span>`
  ];
  
  // 添加其他属性
  const propLines = Object.entries(node.properties)
    .filter(([key]) => key !== 'name') // 排除已经展示的名称
    .map(([key, value]) => `<span>${key}: ${value}</span>`);
  
  return [...titleLines, ...propLines].join('<br>');
}

// 服务对象
const Neo4jService = {
  initNeo4jConnection,
  executeQuery,
  getVisualGraph,
  getRelevantContext // 新增函数导出
};

/**
 * 将Neo4j查询结果格式化为适合LLM提示的文本上下文
 * @param {object} neo4jResult - 包含nodes和relationships的对象
 * @returns {string} - 格式化后的文本上下文
 */
function formatContextForLLM(neo4jResult) {
  const { nodes, relationships } = neo4jResult;

  if (nodes.length === 0 && relationships.length === 0) {
    return "在知识图谱中未找到直接相关的信息。";
  }

  let contextString = "知识图谱信息：\n";
  const nodeMap = new Map(nodes.map(n => [n.id, n])); // 用于快速查找节点

  // 描述节点
  nodes.forEach(node => {
    const props = Object.entries(node.properties)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    contextString += `- 节点 (${node.labels.join(', ')}): ${props}\n`;
  });

  // 描述关系
  relationships.forEach(rel => {
    const startNode = nodeMap.get(rel.startNodeId);
    const endNode = nodeMap.get(rel.endNodeId);
    const startName = startNode?.properties?.name || `节点 ${rel.startNodeId}`;
    const endName = endNode?.properties?.name || `节点 ${rel.endNodeId}`;
    const relProps = Object.entries(rel.properties)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    const relDesc = relProps ? ` (${relProps})` : '';
    contextString += `- 关系: (${startName}) -[${rel.type}${relDesc}]-> (${endName})\n`;
  });

  return contextString.trim();
}


/**
 * 根据自然语言查询获取相关的文本上下文
 * @param {string} query - 自然语言查询
 * @returns {Promise<string>} - 格式化后的文本上下文
 */
export async function getRelevantContext(query) {
  try {
    console.log("getRelevantContext开始处理查询:", query);

    // 提取关键词
    const keywords = query.toLowerCase()
      .replace(/[？?!！。.,，]/g, ' ')
      .split(' ')
      .filter(term => term.length >= 2);
    
    console.log("提取的关键词:", keywords);
    
    // 构建查询
    let cypher;
    
    if (keywords.length > 0) {
      // 基于关键词构建查询
      const conditions = keywords.map(term => 
        `n.name CONTAINS '${term}' OR m.name CONTAINS '${term}'`
      ).join(' OR ');
      
      cypher = `MATCH (n)-[r]-(m)
                WHERE (${conditions})
                RETURN n, r, m LIMIT 20`;
    } else {
      // 默认查询
      cypher = `MATCH (n)-[r]-(m) 
                RETURN n, r, m LIMIT 10`;
    }
    
    console.log("执行查询:", cypher);
    
    // 执行查询
    const result = await executeQuery(cypher);
    console.log(`查询结果: ${result.nodes.length} 个节点, ${result.relationships.length} 个关系`);
    
    // 如果没有结果，尝试更简单的查询
    if (result.nodes.length === 0 && result.relationships.length === 0) {
      console.log("第一次查询未找到结果，尝试简化查询");
      
      // 构建简化查询 - 只查找节点
      const simpleQuery = `MATCH (n)
                          WHERE ${keywords.map(k => `n.name CONTAINS '${k}'`).join(' OR ')}
                          WITH n LIMIT 5
                          OPTIONAL MATCH (n)-[r]-(m)
                          RETURN n, r, m LIMIT 20`;
      
      console.log("简化查询:", simpleQuery);
      
      try {
        const simpleResult = await executeQuery(simpleQuery);
        console.log(`简化查询结果: ${simpleResult.nodes.length} 个节点, ${simpleResult.relationships.length} 个关系`);
        
        if (simpleResult.nodes.length > 0) {
          return formatContextForLLM(simpleResult);
        }
      } catch (innerError) {
        console.error("简化查询执行失败:", innerError);
      }
      
      // 如果仍然没有结果，尝试最基本的查询
      const basicQuery = `MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 10`;
      console.log("基本查询:", basicQuery);
      
      try {
        const basicResult = await executeQuery(basicQuery);
        if (basicResult.nodes.length > 0) {
          return formatContextForLLM(basicResult);
        }
      } catch (basicError) {
        console.error("基本查询执行失败:", basicError);
      }
      
      // 如果所有尝试都失败，返回默认消息
      return "在知识图谱中未找到直接相关的信息。";
    }
    
    // 格式化结果为文本
    return formatContextForLLM(result);
  } catch (error) {
    console.error('获取Neo4j上下文失败:', error);
    // 返回错误信息或默认值
    return "无法从知识图谱获取上下文信息，但我可以基于通用医学知识回答您的问题。";
  }
}


export default Neo4jService;
