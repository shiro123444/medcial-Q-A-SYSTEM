import neo4j from 'neo4j-driver';

/**
 * 处理Neo4j结果为更易用的格式
 * @param {object} result - Neo4j原始结果对象
 * @returns {object} 处理后的图数据 {nodes, relationships}
 */
export function processNeo4jResult(result) {
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
          processNode(value, nodes, nodeMap);
        } 
        // 2. 安全处理关系
        else if (neo4j.isRelationship(value)) {
          processRelationship(value, relationships);
        } 
        // 3. 安全处理路径
        else if (neo4j.isPath(value)) {
          processPath(value, nodes, relationships, nodeMap);
        }
        // 4. 尝试处理普通对象，可能是Neo4j驱动的自定义类型
        else if (typeof value === 'object') {
          processObject(value, nodes, relationships, nodeMap);
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
 * 处理Neo4j节点
 */
function processNode(value, nodes, nodeMap) {
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

/**
 * 处理Neo4j关系
 */
function processRelationship(value, relationships) {
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

/**
 * 处理Neo4j路径
 */
function processPath(value, nodes, relationships, nodeMap) {
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

/**
 * 处理Neo4j对象
 */
function processObject(value, nodes, relationships, nodeMap) {
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

/**
 * 将Neo4j查询结果格式化为适合LLM提示的文本上下文
 * @param {object} neo4jResult - 包含nodes和relationships的对象
 * @returns {string} - 格式化后的文本上下文
 */
export function formatContextForLLM(neo4jResult) {
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
 * 判断查询结果是否不完整
 * @param {object} result - 查询结果
 * @returns {boolean} - 是否不完整
 */
export function isIncompleteResult(result) {
  // 检查结果是否缺少关键属性
  if (!result || !result.nodes || result.nodes.length === 0) return true;
  
  // 检查节点是否具有预期的属性
  for (const node of result.nodes) {
    if (!node || !node.properties || Object.keys(node.properties).length < 3) { // 假设完整节点至少有3个属性
      return true;
    }
  }
  
  // 检查是否有关系返回
  if (!result.relationships || result.relationships.length === 0) {
    return true; // 节点应该有关系，但没有找到
  }
  
  return false;
}
