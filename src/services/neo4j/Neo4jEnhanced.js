import { executeQuery } from './Neo4jConnection';
import { processNeo4jResult, isIncompleteResult, formatContextForLLM } from './Neo4jProcessor';
import { generateEnhancedQuery, generateFallbackQuery, suggestQueryCorrections, generateSuggestedQueries } from './Neo4jQueryBuilder';
import { collectGraphMetadata } from './Neo4jVisualizer';

/**
 * 增强Neo4j上下文函数，添加反思和自我纠正能力
 * @param {string} query - 原始Cypher查询
 * @param {string} entityType - 实体类型 
 * @param {string} entityName - 实体名称
 * @returns {Promise<object>} - 增强的查询结果与元数据
 */
export async function getEnhancedNeo4jContext(query, entityType, entityName) {
  try {
    // 初始查询尝试
    console.log(`执行初始查询: ${query}`);
    let result = await executeQuery(query);
    const processedResult = processNeo4jResult(result);
    
    // 检查查询结果是否为空或不完整
    if (isIncompleteResult(processedResult)) {
      console.log(`初始查询未返回完整结果，正在尝试增强查询...`);
      
      // 反思过程：确定可能需要的附加信息
      const enhancedQuery = await generateEnhancedQuery(entityType, entityName, processedResult);
      console.log(`生成增强查询: ${enhancedQuery}`);
      
      // 执行增强查询
      let enhancedResult;
      try {
        enhancedResult = await executeQuery(enhancedQuery);
        enhancedResult = processNeo4jResult(enhancedResult);
      } catch (enhancedError) {
        console.error(`增强查询执行失败: ${enhancedError.message}`);
        enhancedResult = { nodes: [], relationships: [] };
      }
      
      // 如果增强查询成功，使用其结果
      if (enhancedResult.nodes && enhancedResult.nodes.length > 0) {
        console.log(`增强查询成功获取更完整信息`);
        result = enhancedResult;
      } else {
        // 第二次尝试失败，尝试更广泛的查询策略
        console.log(`增强查询仍未获得结果，尝试备用策略...`);
        const fallbackQuery = await generateFallbackQuery(entityType, entityName);
        
        try {
          const fallbackResult = await executeQuery(fallbackQuery);
          const processedFallback = processNeo4jResult(fallbackResult);
          
          if (processedFallback.nodes && processedFallback.nodes.length > 0) {
            console.log(`备用查询策略成功`);
            result = processedFallback;
          }
        } catch (fallbackError) {
          console.error(`备用查询执行失败: ${fallbackError.message}`);
        }
      }
      
      // 额外的元数据收集 - 获取所有可能的标签和属性
      let metaData;
      try {
        metaData = await collectGraphMetadata(executeQuery);
      } catch (metaError) {
        console.error(`元数据收集失败: ${metaError.message}`);
        metaData = { 
          error: "元数据收集失败",
          availableLabels: [], 
          relationshipTypes: [], 
          propertyKeys: [] 
        };
      }
      
      // 合并结果与元数据
      return {
        queryResult: result,
        metaData: metaData,
        reflection: {
          initialQuerySuccess: false,
          enhancedQueryApplied: true,
          missingProperties: identifyMissingProperties(result),
          suggestedFollowUp: generateSuggestedQueries(entityType, entityName),
          adaptiveStrategy: suggestAdaptiveStrategy(entityType, entityName, result)
        }
      };
    }
    
    // 初始查询成功的情况
    return {
      queryResult: processedResult,
      reflection: {
        initialQuerySuccess: true,
        enhancedQueryApplied: false,
        completenessAnalysis: analyzeResultCompleteness(processedResult)
      }
    };
  } catch (error) {
    console.error("Neo4j查询过程中出错:", error);
    
    // 错误恢复和反思
    return {
      queryResult: { nodes: [], relationships: [] },
      error: error.message,
      reflection: {
        initialQuerySuccess: false,
        errorAnalysis: analyzeQueryError(error, entityType, entityName),
        suggestedCorrections: suggestQueryCorrections(entityType, entityName)
      }
    };
  }
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
    const processedResult = processNeo4jResult(result);
    console.log(`查询结果: ${processedResult.nodes.length} 个节点, ${processedResult.relationships.length} 个关系`);
    
    // 如果没有结果，尝试更简单的查询
    if (processedResult.nodes.length === 0 && processedResult.relationships.length === 0) {
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
        const processedSimple = processNeo4jResult(simpleResult);
        console.log(`简化查询结果: ${processedSimple.nodes.length} 个节点, ${processedSimple.relationships.length} 个关系`);
        
        if (processedSimple.nodes.length > 0) {
          return formatContextForLLM(processedSimple);
        }
      } catch (innerError) {
        console.error("简化查询执行失败:", innerError);
      }
      
      // 如果仍然没有结果，尝试最基本的查询
      const basicQuery = `MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 10`;
      console.log("基本查询:", basicQuery);
      
      try {
        const basicResult = await executeQuery(basicQuery);
        const processedBasic = processNeo4jResult(basicResult);
        if (processedBasic.nodes.length > 0) {
          return formatContextForLLM(processedBasic);
        }
      } catch (basicError) {
        console.error("基本查询执行失败:", basicError);
      }
      
      // 如果所有尝试都失败，返回默认消息
      return "在知识图谱中未找到直接相关的信息。";
    }
    
    // 格式化结果为文本
    return formatContextForLLM(processedResult);
  } catch (error) {
    console.error('获取Neo4j上下文失败:', error);
    // 返回错误信息或默认值
    return "无法从知识图谱获取上下文信息，但我可以基于通用医学知识回答您的问题。";
  }
}

/**
 * 识别缺失的属性
 * @param {object} result - 查询结果
 * @returns {Array<string>} - 缺失的属性列表
 */
function identifyMissingProperties(result) {
  // 基于常见属性集和当前结果分析缺失的属性
  const commonProperties = ['name', 'description', 'id', 'created_at', 'updated_at'];
  const missingProps = [];
  
  if (result && result.nodes && result.nodes.length > 0) {
    const node = result.nodes[0];
    if (node && node.properties) {
      commonProperties.forEach(prop => {
        if (!node.properties[prop]) {
          missingProps.push(prop);
        }
      });
    }
  }
  
  return missingProps;
}

/**
 * 分析结果完整性
 * @param {object} result - 查询结果
 * @returns {object} - 完整性分析
 */
function analyzeResultCompleteness(result) {
  if (!result || !result.nodes || result.nodes.length === 0) {
    return {
      isComplete: false,
      reason: "没有返回结果"
    };
  }
  
  // 分析是否有预期的关系和属性
  const nodePropertyCount = result.nodes.length > 0 ? 
    Object.keys(result.nodes[0].properties || {}).length : 0;
  
  const relationshipCount = result.relationships ? result.relationships.length : 0;
  
  return {
    isComplete: relationshipCount > 0 && nodePropertyCount >= 3,
    nodePropertyCount: nodePropertyCount,
    relationshipCount: relationshipCount,
    recommendation: relationshipCount === 0 ? "需要进一步查询关系" : 
      (nodePropertyCount < 3 ? "节点属性不完整" : "结果看起来完整")
  };
}

/**
 * 分析查询错误
 * @param {Error} error - 错误对象
 * @param {string} entityType - 实体类型
 * @param {string} entityName - 实体名称
 * @returns {object} - 错误分析
 */
function analyzeQueryError(error, entityType, entityName) {
  const errorMsg = error.message || '';
  
  if (errorMsg.includes("not found")) {
    return {
      type: "NOT_FOUND",
      message: `实体 "${entityName}" 可能不存在，或者标签 "${entityType}" 可能不正确`,
      suggestedAction: "尝试查询所有可能的标签或使用模糊匹配"
    };
  }
  
  if (errorMsg.includes("syntax")) {
    return {
      type: "SYNTAX_ERROR",
      message: "查询语法错误",
      suggestedAction: "尝试使用更简单的查询结构"
    };
  }
  
  return {
    type: "UNKNOWN_ERROR",
    message: "查询过程中发生未知错误",
    suggestedAction: "检查Neo4j连接和查询参数"
  };
}

/**
 * 建议自适应策略
 * @param {string} entityType - 实体类型
 * @param {string} entityName - 实体名称
 * @param {object} result - 查询结果
 * @returns {object} - 自适应策略
 */
function suggestAdaptiveStrategy(entityType, entityName, result) {
  if (!result || !result.nodes || result.nodes.length === 0) {
    return {
      strategy: "BROADEN_SEARCH",
      explanation: "当前搜索未找到结果，建议扩大搜索范围或使用更通用的查询",
      nextSteps: [
        "尝试不使用标签约束",
        "使用模糊匹配技术",
        "查询图数据库结构以了解可用标签"
      ]
    };
  }
  
  const hasCompleteNode = result.nodes.some(node => {
    return node && node.properties && Object.keys(node.properties).length >= 3;
  });
  
  const hasRelationships = result.relationships && result.relationships.length > 0;
  
  if (hasCompleteNode && !hasRelationships) {
    return {
      strategy: "EXPAND_RELATIONSHIPS",
      explanation: "找到了节点但缺少关系信息，建议扩展查询以包含关系",
      nextSteps: [
        "使用多跳查询探索更深层次的关系",
        "查询特定类型的关系",
        "获取反向关系"
      ]
    };
  }
  
  if (!hasCompleteNode && hasRelationships) {
    return {
      strategy: "ENRICH_NODES",
      explanation: "找到了关系但节点信息不完整，建议丰富节点属性",
      nextSteps: [
        "查询节点的所有可能属性",
        "检查属性命名约定",
        "查询节点元数据"
      ]
    };
  }
  
  return {
    strategy: "REFINE_CURRENT",
    explanation: "当前查询已返回部分有用信息，建议细化当前查询",
    nextSteps: [
      "筛选最相关的关系类型",
      "按重要性排序结果",
      "尝试使用聚合函数获取统计信息"
    ]
  };
}
