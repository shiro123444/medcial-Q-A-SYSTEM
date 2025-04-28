import React, { useState, useRef, useEffect } from 'react';
import MessageBubble, { LoadingIndicator } from './MessageBubble';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import OllamaService from '../services/OllamaService';
import DeepSeekService from '../services/DeepSeekService'; // 导入 DeepSeekService
import Neo4jService from '../services/Neo4jService';
import './ChatContainer.css';

const ChatContainer = ({ onMessagesUpdate }) => {
  const [messages, setMessages] = useState(() => {
    // 从 localStorage 加载历史消息
    const savedMessages = localStorage.getItem('chat-messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [availableModels, setAvailableModels] = useState([]);
  const [currentModel, setCurrentModel] = useState('llama3');
  
  // 新增状态变量 - 处理 DeepSeek 的服务
  const [serviceType, setServiceType] = useState(() => {
    return localStorage.getItem('service-type') || 'ollama';
  });
  const [deepseekApiKey, setDeepseekApiKey] = useState(() => {
    return localStorage.getItem('deepseek-api-key') || '';
  });

  const messagesEndRef = useRef(null);

  // 当消息变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('chat-messages', JSON.stringify(messages));
    
    // 通知父组件消息更新
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages, onMessagesUpdate]);

  // 保存服务类型和 API Key 到 localStorage
  useEffect(() => {
    localStorage.setItem('service-type', serviceType);
  }, [serviceType]);

  useEffect(() => {
    if (deepseekApiKey) {
      localStorage.setItem('deepseek-api-key', deepseekApiKey);
      DeepSeekService.setApiKey(deepseekApiKey);
    }
  }, [deepseekApiKey]);

  // 消息变化时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, streamingResponse]);

  // 组件挂载时检查连接和获取模型
  useEffect(() => {
    checkConnection();
  }, [serviceType, deepseekApiKey]); // 当服务类型或 API Key 变化时重新检查连接

  // 检查服务连接
  const checkConnection = async () => {
    setIsCheckingConnection(true);
    setIsConnected(false);
    setAvailableModels([]);
    
    try {
      if (serviceType === 'ollama') {
        await checkOllamaConnection();
      } else {
        await checkDeepSeekConnection();
      }
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // 检查 Ollama 连接
  const checkOllamaConnection = async () => {
    try {
      const models = await OllamaService.getModels();
      
      if (models && models.length > 0) {
        setAvailableModels(models.map(model => model.name));
        setCurrentModel(models[0].name); // 默认使用第一个模型
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Ollama connection error:', error);
      setIsConnected(false);
      throw error;
    }
  };

  // 检查 DeepSeek 连接
  const checkDeepSeekConnection = async () => {
    if (!deepseekApiKey) {
      setIsConnected(false);
      return;
    }
    
    try {
      // 设置 API Key
      DeepSeekService.setApiKey(deepseekApiKey);
      
      // 获取模型列表
      const models = await DeepSeekService.getModels();
      
      if (models && models.length > 0) {
        setAvailableModels(models.map(model => model.id));
        setCurrentModel(models[0].id); // 默认使用第一个模型
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('DeepSeek connection error:', error);
      setIsConnected(false);
      throw error;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理模型切换
  const handleModelChange = (model) => {
    setCurrentModel(model);
  };

  // 处理服务类型切换
  const handleServiceTypeChange = (type) => {
    setServiceType(type);
  };

  // 处理 DeepSeek API Key 变更
  const handleDeepSeekApiKeyChange = (apiKey) => {
    setDeepseekApiKey(apiKey);
  };

  // 处理清除聊天
  const handleClearChat = () => {
    setMessages([]);
    setStreamingResponse('');
    setIsLoading(false);
  };

  // 根据用户问题分析需要查询的关系类型
  const analyzeQueryForRelationshipTypes = (query) => {
    // 简单的关键词匹配，可以根据需要扩展
    const keywords = {
      '症状': 'HAS_SYMPTOM',
      '表现': 'HAS_SYMPTOM',
      '症狀': 'HAS_SYMPTOM',
      '引起': 'CAUSED_BY',
      '原因': 'CAUSED_BY',
      '病因': 'CAUSED_BY',
      '治疗': 'TREATED_BY',
      '药物': 'TREATED_BY',
      '用药': 'TREATED_BY',
      '吃什么': 'recommend_eat',
      '食物': 'recommend_eat',
      '饮食': 'recommend_eat',
      '忌口': 'UNSUITABLE_FOOD',
      '不能吃': 'UNSUITABLE_FOOD',
      '检查': 'NEED_CHECK',
      '部门': 'DEPARTMENT',
      '科室': 'DEPARTMENT'
    };
    
    query = query.toLowerCase();
    const relevantRelations = [];
    
    for (const [keyword, relation] of Object.entries(keywords)) {
      if (query.includes(keyword.toLowerCase())) {
        relevantRelations.push(relation);
      }
    }
    
    // 如果没有匹配到任何关系，返回核心关系和recommend_eat
    return relevantRelations.length > 0 
      ? relevantRelations 
      : ['HAS_SYMPTOM', 'CAUSED_BY', 'TREATED_BY', 'recommend_eat'];
  };

  // 增强 Neo4j 上下文提取函数
  const getEnhancedNeo4jContext = async (text) => {
    try {
      console.log('分析用户查询:', text);
      
      // 使用改进后的功能直接从Neo4jService获取Cypher查询
      const cypher = Neo4jService.generateMedicalCypher(text);
      console.log('智能生成的Cypher查询:', cypher);
      
      // 执行查询并获取结果
      const result = await Neo4jService.executeQuery(cypher);
      console.log(`查询结果: ${result.nodes.length} 个节点, ${result.relationships.length} 个关系`);
      
      // 如果没有结果，尝试更通用的后备查询
      if (result.nodes.length === 0 && result.relationships.length === 0) {
        console.log("主查询未找到结果，执行后备查询");
        
        // 后备查询1: 尝试模糊匹配
        const backupQuery = `MATCH (n)-[r]-(m) 
                            WHERE any(term IN split(toLower('${text}'), ' ') 
                                   WHERE n.name CONTAINS term OR m.name CONTAINS term)
                            RETURN n, r, m LIMIT 15`;
        
        console.log('后备查询:', backupQuery);
        const backupResult = await Neo4jService.executeQuery(backupQuery);
        
        if (backupResult.nodes.length > 0 || backupResult.relationships.length > 0) {
          return formatStructuredContext(backupResult);
        }
        
        // 后备查询2: 非常通用的查询
        console.log("后备查询也未找到结果，使用通用查询");
        return "在知识图谱中未找到与您问题直接相关的医学信息。但我可以提供一些通用建议，也可以尝试提供更具体的症状或疾病名称，以获得更精确的回答。";
      }
      
      // 格式化结果为结构化上下文
      return formatStructuredContext(result);
      
    } catch (error) {
      console.error("知识图谱查询失败:", error);
      return "由于技术原因，无法访问医学知识图谱。我将尝试根据我的医学知识为您提供一般性建议。请描述您的问题，并提供更多细节。";
    }
  };

  // 将 Neo4j 结果格式化为结构化上下文
  const formatStructuredContext = (neo4jResult) => {
    const { nodes, relationships } = neo4jResult;
    
    if (!nodes || !relationships || (nodes.length === 0 && relationships.length === 0)) {
      return "在知识图谱中未找到直接相关的信息。";
    }
    
    console.log(`格式化 ${nodes.length} 个节点和 ${relationships.length} 个关系`);
    
    try {
      // 创建节点的快速查找映射
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      
      // 记录所有找到的实体，不只限于疾病
      const entities = new Map();
      
      // 特殊处理：如果没有疾病节点但有其他节点，直接提取所有节点信息
      let hasDisease = false;
      
      // 检查是否有疾病节点
      for (const node of nodes) {
        if (node.labels && Array.isArray(node.labels) && node.labels.includes('Disease')) {
          hasDisease = true;
          break;
        }
        if (node.properties && node.properties.name && 
           (node.properties.name.includes('感冒') || node.properties.name.includes('冒'))) {
          hasDisease = true;
          break;
        }
      }
      
      // 直接处理所有节点和关系
      for (const node of nodes) {
        // 获取节点名称或标识符
        const nodeName = node.properties?.name || 
                         node.properties?.title || 
                         `节点-${node.id.substring(0, 8)}`;
        
        // 确定节点类型
        let nodeType = node.labels && node.labels.length > 0 ? node.labels[0] : '未知类型';
        
        // 特殊处理感冒节点
        if (nodeName.includes('感冒')) {
          nodeType = 'Disease';
        }
        
        // 创建实体对象
        if (!entities.has(nodeName)) {
          entities.set(nodeName, {
            type: nodeType,
            symptoms: new Set(),
            causes: new Set(),
            treatments: new Set(),
            foods: new Set(),
            related: new Set(),
            relationships: []
          });
        }
      }
      
      // 处理所有关系
      for (const rel of relationships) {
        const startNode = nodeMap.get(rel.startNodeId);
        const endNode = nodeMap.get(rel.endNodeId);
        
        if (!startNode || !endNode) continue;
        
        const startName = startNode.properties?.name || 
                          startNode.properties?.title || 
                          `节点-${startNode.id.substring(0, 8)}`;
        
        const endName = endNode.properties?.name || 
                        endNode.properties?.title || 
                        `节点-${endNode.id.substring(0, 8)}`;
        
        // 确保实体存在
        if (!entities.has(startName)) {
          const nodeType = startNode.labels && startNode.labels.length > 0 ? 
                           startNode.labels[0] : '未知类型';
          entities.set(startName, {
            type: nodeType,
            symptoms: new Set(),
            causes: new Set(),
            treatments: new Set(),
            foods: new Set(),
            related: new Set(),
            relationships: []
          });
        }
        
        const entity = entities.get(startName);
        
        // 特殊处理"recommend_eat"关系
        if (rel.type === 'recommend_eat') {
          entity.foods.add(`推荐食物: ${endName}`);
          entity.relationships.push({
            type: '推荐食物',
            target: endName,
            properties: rel.properties || {}
          });
        }
        // 处理其他关系类型
        else {
          switch (rel.type) {
            case 'HAS_SYMPTOM':
            case '症状':
              entity.symptoms.add(endName);
              break;
            case 'CAUSED_BY':
            case '病因':
              entity.causes.add(endName);
              break;
            case 'TREATED_BY':
            case '治疗':
              entity.treatments.add(endName);
              break;
            default:
              // 记录所有相关实体
              entity.related.add(endName);
              entity.relationships.push({
                type: rel.type,
                target: endName,
                properties: rel.properties || {}
              });
          }
        }
      }
      
      // 将收集的信息格式化为字符串
      let contextString = '知识图谱信息:\n\n';
      
      // 优先处理疾病实体
      for (const [name, info] of entities.entries()) {
        // 跳过无关实体
        if (info.relationships.length === 0 && 
            info.symptoms.size === 0 && 
            info.causes.size === 0 && 
            info.treatments.size === 0 && 
            info.foods.size === 0 && 
            info.related.size === 0) {
          continue;
        }
        
        // 不使用纯大写的标题
        const entityType = info.type === 'DISEASE' ? '疾病' : 
                          info.type === 'Disease' ? '疾病' : 
                          info.type === 'SYMPTOM' ? '症状' : 
                          info.type === 'Symptom' ? '症状' : 
                          info.type === 'FOOD' ? '食物' : info.type;
        
        contextString += `${entityType}: ${name}\n`;
        
        if (info.symptoms.size > 0) {
          contextString += `症状: ${Array.from(info.symptoms).join(', ')}\n`;
        }
        
        if (info.causes.size > 0) {
          contextString += `病因: ${Array.from(info.causes).join(', ')}\n`;
        }
        
        if (info.treatments.size > 0) {
          contextString += `治疗: ${Array.from(info.treatments).join(', ')}\n`;
        }
        
        if (info.foods.size > 0) {
          contextString += `饮食建议: ${Array.from(info.foods).join(', ')}\n`;
        }
        
        if (info.related.size > 0) {
          contextString += `相关信息: ${Array.from(info.related).join(', ')}\n`;
        }
        
        if (info.relationships.length > 0) {
          const groupedRelations = {};
          info.relationships.forEach(rel => {
            if (!groupedRelations[rel.type]) {
              groupedRelations[rel.type] = [];
            }
            groupedRelations[rel.type].push(rel.target);
          });
          
          for (const [relType, targets] of Object.entries(groupedRelations)) {
            if (targets.length > 0) {
              contextString += `${relType}: ${targets.join(', ')}\n`;
            }
          }
        }
        
        contextString += '\n';
      }
      
      // 如果没有找到有意义的实体关系，添加一个通用说明
      if (contextString === '知识图谱信息:\n\n') {
        return "在知识图谱中未找到结构化的相关信息。";
      }
      
      return contextString.trim();
    } catch (error) {
      console.error("格式化Neo4j结果时出错:", error);
      
      // 出错时返回一个简单的节点列表
      try {
        let fallbackContext = "知识图谱信息 (原始):\n\n";
        
        // 列出所有节点
        if (nodes.length > 0) {
          fallbackContext += "找到的实体:\n";
          nodes.forEach(node => {
            const name = node.properties?.name || 
                        node.properties?.title || 
                        `实体-${node.id.substring(0, 8)}`;
            fallbackContext += `- ${name}\n`;
          });
        }
        
        // 列出部分关系
        if (relationships.length > 0) {
          fallbackContext += "\n关系 (前10个):\n";
          relationships.slice(0, 10).forEach(rel => {
            fallbackContext += `- 关系类型: ${rel.type}\n`;
          });
        }
        
        return fallbackContext.trim();
      } catch (fallbackError) {
        console.error("生成备用上下文也失败:", fallbackError);
        return "在知识图谱中找到一些信息，但无法正确格式化。";
      }
    }
  };

  // 构建增强后的提示词
  const buildEnhancedPrompt = (text, neo4jContext) => {
    return `你是 Thinking Bio 医疗助手，一个专业的医疗诊断问答系统。请根据以下知识图谱中的医学信息，回答用户的问题。

你的工作流程：
1. 首先分析用户问题，识别其中的主要症状、疾病或医学主题
2. 确定这些主题的类别（如：症状、疾病、药物等）
3. 如果用户提供的信息不足，主动询问关键信息：
   - 年龄和性别
   - 症状持续时间
   - 症状严重程度
   - 是否有其他伴随症状
   - 是否有相关病史
4. 根据所有收集到的信息，利用知识图谱进行更精准的匹配和分析
5. 提供结构化的专业回答，包括可能的原因、建议措施和注意事项

你的回答要求：
1. 使用专业但通俗易懂的语言
2. 提供结构化信息，使用Markdown格式提高可读性
3. 对于医疗建议，明确提醒用户咨询专业医生
4. 直接引用知识图谱中的信息，不要编造不存在的内容
5. 如知识图谱中没有相关信息，坦诚告知用户并提供通用建议

知识图谱信息：
${neo4jContext}

用户问题：
${text}

回答：`;
  };

  // 处理发送消息
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    
    // 添加用户消息
    const newUserMessage = { text, isUser: true, id: Date.now() };
    setMessages(prev => [...prev, newUserMessage]);
    
    // 开始加载状态
    setIsLoading(true);
    setStreamingResponse('');

    try {
      // 如果已连接到服务
      if (isConnected) {
        // 1. 获取增强的 Neo4j 上下文
        const neo4jContext = await getEnhancedNeo4jContext(text);
        
        // 2. 构建增强提示词
        const enhancedPrompt = buildEnhancedPrompt(text, neo4jContext);
        
        // 3. 调用相应的 AI 服务
        if (serviceType === 'ollama') {
          callOllamaService(enhancedPrompt);
        } else {
          callDeepSeekService(enhancedPrompt);
        }
      } else {
        // 未连接到服务，使用模拟响应
        await simulateStreamingResponse(text);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      // 添加错误消息
      setMessages(prev => [...prev, {
        text: "非常抱歉，处理您的请求时遇到了错误。请稍后重试。",
        isUser: false,
        id: Date.now()
      }]);
      setIsLoading(false);
      
      // 再次检查连接状态
      checkConnection();
    }
  };

  // 调用 Ollama 服务
  const callOllamaService = (prompt) => {
    OllamaService.generateStreamingResponse(
      prompt,
      { model: currentModel },
      (chunk) => {
        // 更新流式响应
        setStreamingResponse(prev => prev + chunk);
      },
      (fullResponse) => {
        // 响应完成，添加到消息列表
        setMessages(prev => [...prev, {
          text: fullResponse,
          isUser: false,
          id: Date.now()
        }]);
        setStreamingResponse('');
        setIsLoading(false);
      },
      (error) => {
        console.error('Ollama streaming error:', error);
        setMessages(prev => [...prev, {
          text: "对不起，处理请求时发生错误。请稍后再试。",
          isUser: false,
          id: Date.now()
        }]);
        setStreamingResponse('');
        setIsLoading(false);
        
        checkConnection();
      }
    );
  };

  // 调用 DeepSeek 服务
  const callDeepSeekService = (prompt) => {
    DeepSeekService.generateStreamingResponse(
      prompt,
      { model: currentModel },
      (chunk) => {
        // 更新流式响应
        setStreamingResponse(prev => prev + chunk);
      },
      (fullResponse) => {
        // 响应完成，添加到消息列表
        setMessages(prev => [...prev, {
          text: fullResponse,
          isUser: false,
          id: Date.now()
        }]);
        setStreamingResponse('');
        setIsLoading(false);
      },
      (error) => {
        console.error('DeepSeek streaming error:', error);
        setMessages(prev => [...prev, {
          text: "对不起，处理请求时发生错误。请稍后再试。",
          isUser: false,
          id: Date.now()
        }]);
        setStreamingResponse('');
        setIsLoading(false);
        
        checkConnection();
      }
    );
  };

  // 模拟流式响应（本地开发时无需连接服务）
  const simulateStreamingResponse = async (prompt) => {
    // 创建模拟响应
    const fullResponse = `这是对问题"${prompt}"的模拟回答。

在真实实现中，这会是从您选择的AI模型（Ollama 或 DeepSeek）返回的回答。

要使用 Ollama，请确保：
1. 从 https://ollama.ai 安装 Ollama
2. 本地运行 Ollama
3. 加载您喜欢的模型（如"ollama pull llama3"）

要使用 DeepSeek API，请：
1. 获取 DeepSeek API Key
2. 在模型选择器中设置您的 API Key

回答会像这样一个词一个词地流式显示。`;
    
    // 通过添加词语和延迟来模拟流式传输
    const words = fullResponse.split(' ');
    let currentResponse = '';
    
    for (let i = 0; i < words.length; i++) {
      // 添加一个词（除第一个词外，前面加空格）
      const spacer = i > 0 ? ' ' : '';
      currentResponse += spacer + words[i];
      
      // 更新流式响应
      setStreamingResponse(currentResponse);
      
      // 等待一个小延迟（20-80ms随机）
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 60));
    }
    
    // 完成响应
    setMessages(prev => [...prev, {
      text: fullResponse,
      isUser: false,
      id: Date.now()
    }]);
    
    setStreamingResponse('');
    setIsLoading(false);
  };

  return (
    <div className="chat-container">
      <ChatHeader 
        availableModels={availableModels}
        currentModel={currentModel}
        onModelChange={handleModelChange}
        isConnected={isConnected}
        isLoading={isLoading || isCheckingConnection}
        onClearChat={handleClearChat}
        serviceType={serviceType}
        onServiceTypeChange={handleServiceTypeChange}
        deepseekApiKey={deepseekApiKey}
        onDeepseekApiKeyChange={handleDeepSeekApiKeyChange}
      />
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2>询问 Thinking Bio</h2>
            <p>开始对话，获取 AI 支持的医疗知识解答</p>
            {!isConnected && !isCheckingConnection && (
              <div className="connection-warning">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="#ef4444" fill="none" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>
                  {serviceType === 'ollama' 
                    ? '未连接到 Ollama。回答将被模拟。' 
                    : '未连接到 DeepSeek API。回答将被模拟。'}
                </p>
                <button onClick={checkConnection}>重试连接</button>
              </div>
            )}
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
            />
          ))
        )}
        
        {/* 显示流式响应 */}
        {streamingResponse && (
          <MessageBubble
            message={streamingResponse}
            isUser={false}
          />
        )}
        
        {/* 仅在未流式传输时显示加载指示器 */}
        {isLoading && !streamingResponse && <LoadingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatContainer;
