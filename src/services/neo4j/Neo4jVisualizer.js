/**
 * 格式化数据用于可视化
 * @param {object} data - 图数据
 * @returns {object} - 格式化的可视化数据
 */
export function formatForVisualization(data) {
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
export function formatNodeTooltip(node) {
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

/**
 * 收集图数据库元数据
 * @param {function} executeQuery - 执行查询的函数
 * @returns {Promise<object>} - 元数据
 */
export async function collectGraphMetadata(executeQuery) {
  try {
    // 获取所有标签
    const labelsResult = await executeQuery("CALL db.labels()");
    
    // 获取所有关系类型
    const relTypesResult = await executeQuery("CALL db.relationshipTypes()");
    
    // 获取属性键
    const propKeysResult = await executeQuery("CALL db.propertyKeys()");
    
    // 获取节点计数统计
    const nodeCountsQuery = "MATCH (n) RETURN distinct labels(n) as label, count(n) as count";
    const nodeCountsResult = await executeQuery(nodeCountsQuery);
    
    // 获取关系计数统计
    const relCountsQuery = "MATCH ()-[r]->() RETURN type(r) as type, count(r) as count";
    const relCountsResult = await executeQuery(relCountsQuery);
    
    return {
      availableLabels: extractResultValues(labelsResult),
      relationshipTypes: extractResultValues(relTypesResult),
      propertyKeys: extractResultValues(propKeysResult),
      nodeCounts: processCountResults(nodeCountsResult),
      relationshipCounts: processCountResults(relCountsResult)
    };
  } catch (error) {
    console.error("获取元数据时出错:", error);
    return {
      error: "无法获取完整元数据",
      availableLabels: [],
      relationshipTypes: [],
      propertyKeys: []
    };
  }
}

/**
 * 从Neo4j结果中提取值
 * @param {object} result - Neo4j查询结果
 * @returns {Array} - 提取的值数组
 */
function extractResultValues(result) {
  if (!result || !result.nodes || result.nodes.length === 0) {
    return [];
  }
  
  // 尝试从节点属性中提取值
  const values = [];
  result.nodes.forEach(node => {
    if (node.properties) {
      const props = Object.values(node.properties);
      if (props.length > 0) {
        values.push(...props);
      }
    }
  });
  
  return values;
}

/**
 * 处理计数结果
 * @param {object} results - 计数查询结果
 * @returns {object} - 处理后的计数
 */
function processCountResults(results) {
  const counts = {};
  if (results && results.nodes && results.nodes.length > 0) {
    results.nodes.forEach(node => {
      const label = node.properties.label || node.properties.type;
      const count = node.properties.count;
      
      if (Array.isArray(label)) {
        // 处理多标签节点
        const labelStr = label.join(':');
        counts[labelStr] = parseInt(count, 10);
      } else if (label) {
        counts[label] = parseInt(count, 10);
      }
    });
  }
  return counts;
}
