/**
 * 生成医疗相关的Cypher查询语句
 * @param {string} query - 自然语言查询
 * @returns {string} - Cypher查询语句
 */
export function generateMedicalCypher(query) {
  // 转换为小写便于处理
  const lowerQuery = query.toLowerCase();
  
  // 特殊处理"感冒"查询
  if (lowerQuery.includes('感冒')) {
    console.log('检测到感冒相关查询，使用直接查询方式');
    
    // 直接查询感冒节点的所有属性和关系
    return `MATCH (n:Disease {name: '感冒'}) 
            RETURN n 
            UNION 
            MATCH (n:Disease {name: '感冒'})-[r]-(m) 
            RETURN n, r, m 
            LIMIT 50`;
  }

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
 * @returns {object} - 包含entities和categories的对象
 */
export function extractMedicalTerms(query) {
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
 * 生成增强查询
 * @param {string} entityType - 实体类型
 * @param {string} entityName - 实体名称
 * @param {object} previousResult - 上一次查询结果
 * @returns {string} - 增强的查询
 */
export async function generateEnhancedQuery(entityType, entityName, previousResult) {
  // 基于实体类型和前一个结果生成更全面的查询
  let enhancedQuery = '';
  
  // 尝试获取所有可能的关系，双向关系
  enhancedQuery = `
    MATCH (n:${entityType} {name: "${entityName}"})
    OPTIONAL MATCH (n)-[r]->(m)
    OPTIONAL MATCH (o)-[r2]->(n)
    RETURN n, r, m, r2, o
  `;
  
  // 如果实体名称可能不准确，尝试模糊匹配
  if (!previousResult || !previousResult.nodes || previousResult.nodes.length === 0) {
    enhancedQuery = `
      MATCH (n:${entityType})
      WHERE n.name CONTAINS "${entityName}" OR "${entityName}" CONTAINS n.name
      OPTIONAL MATCH (n)-[r]->(m)
      OPTIONAL MATCH (o)-[r2]->(n)
      RETURN n, r, m, r2, o
      LIMIT 5
    `;
  }
  
  return enhancedQuery;
}

/**
 * 生成备用查询策略
 * @param {string} entityType - 实体类型
 * @param {string} entityName - 实体名称
 * @returns {string} - 备用查询
 */
export async function generateFallbackQuery(entityType, entityName) {
  // 尝试获取所有节点的类型，不限定具体标签
  const query = `
    MATCH (n)
    WHERE n.name = "${entityName}" OR n.name CONTAINS "${entityName}"
    OPTIONAL MATCH (n)-[r]-(m)
    RETURN n, r, m
    LIMIT 10
  `;
  
  return query;
}

/**
 * 建议查询修正
 * @param {string} entityType - 实体类型
 * @param {string} entityName - 实体名称
 * @returns {Array} - 建议的查询修正
 */
export function suggestQueryCorrections(entityType, entityName) {
  return [
    // 尝试不同的标签
    {
      purpose: "查找实际标签",
      query: `MATCH (n) WHERE n.name = "${entityName}" RETURN n, labels(n)`
    },
    
    // 尝试模糊匹配名称
    {
      purpose: "模糊匹配名称",
      query: `MATCH (n) WHERE n.name CONTAINS "${entityName}" RETURN n, labels(n)`
    },
    
    // 尝试使用属性查询
    {
      purpose: "通过其他属性查询",
      query: `MATCH (n) WHERE any(prop in keys(n) WHERE n[prop] CONTAINS "${entityName}") RETURN n, labels(n) LIMIT 5`
    }
  ];
}

/**
 * 生成建议的后续查询
 * @param {string} entityType - 实体类型
 * @param {string} entityName - 实体名称
 * @returns {Array} - 建议的查询
 */
export function generateSuggestedQueries(entityType, entityName) {
  return [
    // 获取详细属性和关系类型
    {
      purpose: "获取详细关系",
      query: `MATCH (n:${entityType} {name: "${entityName}"})-[r]-(m) 
              RETURN n, r, m`
    },
    
    // 获取扩展关系（路径分析）
    {
      purpose: "扩展路径分析",
      query: `MATCH p=(n:${entityType} {name: "${entityName}"})-[*1..2]-(m) 
              RETURN p LIMIT 10`
    },
    
    // 属性模糊匹配
    {
      purpose: "模糊匹配",
      query: `MATCH (n:${entityType}) 
              WHERE n.name CONTAINS "${entityName}" 
              RETURN n`
    },
    
    // 获取特定类型的关系
    {
      purpose: "特定关系类型",
      query: `MATCH (n:${entityType} {name: "${entityName}"})-[r:RELATED_TO|HAS_PROPERTY]->(m) 
              RETURN n, r, m`
    }
  ];
}
