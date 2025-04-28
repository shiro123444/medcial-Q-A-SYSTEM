import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import neo4j from 'neo4j-driver';

// 样式定义 - 苹果风格简约设计
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '12px',
    backgroundColor: '#f5f5f7',
  },
  configPanel: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  configContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#f1f1f3',
  },
  selectContainer: {
    position: 'relative',
    minWidth: '180px',
    flex: '0 0 auto',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#f1f1f3',
    appearance: 'none',
    cursor: 'pointer',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  controls: {
    width: '100%',
    marginBottom: '16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  button: {
    padding: '10px 16px',
    backgroundColor: '#0071e3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#f1f1f3',
    color: '#333',
  },
  vizContainer: {
    position: 'relative',
    flex: 1,
    width: '100%',
    minHeight: '700px',
    height: 'calc(100vh - 240px)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  viz: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    position: 'relative',
  },
  fullscreenButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    border: 'none',
  },
  nodeInfoPanel: {
    position: 'absolute',
    top: '10px',
    right: '56px',
    width: '300px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    padding: '16px',
    zIndex: 100,
    display: 'none',
    maxHeight: '80%',
    backdropFilter: 'blur(10px)',
    overflowY: 'auto',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '10px',
    marginBottom: '10px',
    borderBottom: '1px solid #eee',
  },
  panelTitle: {
    margin: 0,
    color: '#333',
    fontSize: '16px',
    fontWeight: '600',
  },
  closeButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#f1f1f3',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  debug: {
    width: '100%',
    marginTop: '16px',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  debugTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '8px',
    color: '#333',
  },
  logContainer: {
    maxHeight: '160px',
    overflowY: 'auto',
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: '#f8f8fa',
  },
  infoTip: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    color: '#0c4a6e',
    fontSize: '13px',
    backdropFilter: 'blur(5px)',
    zIndex: 5,
  },
  info: {
    color: '#34c759',
    margin: '4px 0',
    fontSize: '13px',
  },
  error: {
    color: '#ff3b30',
    margin: '4px 0',
    fontSize: '13px',
  },
  nodeBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    color: 'white',
    fontWeight: '500',
    fontSize: '12px',
    marginRight: '5px',
    marginBottom: '5px',
  },
  propertyRow: {
    display: 'flex',
    marginBottom: '8px',
    fontSize: '14px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '8px',
  },
  propertyKey: {
    fontWeight: '500',
    width: '100px',
    color: '#4b5563',
  },
  propertyValue: {
    flex: 1,
    color: '#1f2937',
    wordBreak: 'break-word',
  },
  fullscreenOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
  },
  fullscreenHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
  },
  fullscreenTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
  },
  fullscreenContent: {
    flex: 1,
    position: 'relative',
  },
};

/**
 * Neo4j知识图谱可视化组件
 */
const Neo4jGraphVisualization = ({ 
  serverUrl = 'bolt://localhost:7687',
  serverUser = 'neo4j',
  serverPassword = 'fyz040913',
  database = 'neo4j',
  initialQueryType = 'basic',
  initialSearchTerm = '',
  autoRender = true
}) => {
  // 状态变量
  const [queryType, setQueryType] = useState(initialQueryType);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showLabels, setShowLabels] = useState(true);
  const [showRelationships, setShowRelationships] = useState(true);
  const [logs, setLogs] = useState([]);
  const [currentViz, setCurrentViz] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Refs
  const vizRef = useRef(null);
  const nodeInfoPanelRef = useRef(null);
  const nodeInfoContentRef = useRef(null);
  
  // Neo4j配置
  const neo4jConfig = {
    serverUrl,
    serverUser,
    serverPassword,
    database
  };
  
  // 节点颜色映射
  const nodeColors = {
    'Disease': '#ef4444',
    'Symptom': '#f59e0b',
    'Drug': '#3b82f6',
    'Food': '#84cc16',
    'Check': '#8b5cf6',
    'Department': '#ec4899',
    'Producer': '#06b6d4',
    'Node': '#6366f1'
  };
  
  // 日志函数
  const log = (message, isError = false) => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      message,
      isError
    };
    
    setLogs(prevLogs => [...prevLogs, newLog]);
    console.log(`${isError ? 'ERROR: ' : ''}${message}`);
  };
  
  // 清除图谱
  const clearViz = () => {
    if (vizRef.current) {
      vizRef.current.innerHTML = '';
    }
    closeNodeInfo();
    log('已清除图谱');
  };
  
  // 关闭节点信息面板
  const closeNodeInfo = () => {
    if (nodeInfoPanelRef.current) {
      nodeInfoPanelRef.current.style.display = 'none';
    }
  };
  
  // 显示节点信息面板
  const showNodeInfo = (node) => {
    if (!nodeInfoPanelRef.current || !nodeInfoContentRef.current) return;
    
    // 清空之前的内容
    nodeInfoContentRef.current.innerHTML = '';
    
    // 添加节点类型
    const typeDiv = document.createElement('div');
    typeDiv.style.marginBottom = '10px';
    
    if (node.labels && node.labels.length > 0) {
      node.labels.forEach(label => {
        const typeBadge = document.createElement('span');
        typeBadge.style.display = 'inline-block';
        typeBadge.style.padding = '4px 8px';
        typeBadge.style.borderRadius = '4px';
        typeBadge.style.color = 'white';
        typeBadge.style.fontWeight = '500';
        typeBadge.style.fontSize = '12px';
        typeBadge.style.marginRight = '5px';
        typeBadge.style.backgroundColor = nodeColors[label.toLowerCase()] || '#6366f1';
        typeBadge.textContent = label;
        typeDiv.appendChild(typeBadge);
      });
    }
    
    nodeInfoContentRef.current.appendChild(typeDiv);
    
    // 添加节点属性
    if (node.properties) {
      for (const [key, value] of Object.entries(node.properties)) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.marginBottom = '8px';
        row.style.fontSize = '14px';
        row.style.borderBottom = '1px solid #f3f4f6';
        row.style.paddingBottom = '8px';
        
        const keyEl = document.createElement('div');
        keyEl.style.fontWeight = '500';
        keyEl.style.width = '120px';
        keyEl.style.color = '#4b5563';
        keyEl.textContent = key + ':';
        
        const valueEl = document.createElement('div');
        valueEl.style.flex = '1';
        valueEl.style.color = '#1f2937';
        valueEl.style.wordBreak = 'break-word';
        valueEl.textContent = value;
        
        row.appendChild(keyEl);
        row.appendChild(valueEl);
        nodeInfoContentRef.current.appendChild(row);
      }
    }
    
    // 显示面板
    nodeInfoPanelRef.current.style.display = 'block';
  };
  
  // 获取选择的查询类型
  const getSelectedQuery = () => {
    let cypher;
    
    // 如果有自定义搜索词，优先使用
    if (searchTerm) {
      // 使用搜索词构建查询
      switch(queryType) {
        case 'basic':
          cypher = `MATCH (n) WHERE n.name =~ "(?i).*${searchTerm}.*" RETURN n LIMIT 15`;
          break;
        case 'relationships':
          cypher = `MATCH (n)-[r]-(m) 
                    WHERE n.name =~ "(?i).*${searchTerm}.*" OR 
                          m.name =~ "(?i).*${searchTerm}.*" 
                    RETURN DISTINCT n, r, m LIMIT 20`;
          break;
        case 'disease':
          cypher = `MATCH (n:Disease)-[r]-(m) 
                    WHERE n.name =~ "(?i).*${searchTerm}.*" 
                    RETURN DISTINCT n, r, m LIMIT 20`;
          break;
        case 'diabetes':
          // 对于糖尿病类型，仍然保留原始查询，但添加搜索词
          cypher = `MATCH (n)-[r]-(m) 
                    WHERE (n.name =~ "(?i).*糖尿病.*" OR m.name =~ "(?i).*糖尿病.*") 
                          ${searchTerm !== '糖尿病' ? `OR n.name =~ "(?i).*${searchTerm}.*" OR m.name =~ "(?i).*${searchTerm}.*"` : ''}
                    RETURN DISTINCT n, r, m LIMIT 20`;
          break;
        case 'food':
          cypher = `MATCH (n:Food)-[r]-(m) 
                    WHERE n.name =~ "(?i).*${searchTerm}.*" OR 
                          m.name =~ "(?i).*${searchTerm}.*"
                    RETURN DISTINCT n, r, m LIMIT 20`;
          break;
        case 'all':
          cypher = `MATCH (n)-[r]-(m) 
                    WHERE (n:Disease OR n:Symptom OR n:Drug OR n:Food OR n:Check)
                          AND (n.name =~ "(?i).*${searchTerm}.*" OR m.name =~ "(?i).*${searchTerm}.*")
                    RETURN DISTINCT n, r, m LIMIT 25`;
          break;
        default:
          cypher = `MATCH (n)-[r]-(m) 
                    WHERE n.name =~ "(?i).*${searchTerm}.*" OR 
                          m.name =~ "(?i).*${searchTerm}.*"
                    RETURN n, r, m LIMIT 15`;
      }
    } else {
      // 默认查询（无搜索词）
      switch(queryType) {
        case 'basic':
          cypher = 'MATCH (n) RETURN n LIMIT 10';
          break;
        case 'relationships':
          cypher = 'MATCH (n)-[r]-(m) RETURN DISTINCT n, r, m LIMIT 15';
          break;
        case 'disease':
          cypher = 'MATCH (n:Disease)-[r]-(m) RETURN DISTINCT n, r, m LIMIT 15';
          break;
        case 'diabetes':
          cypher = 'MATCH (n)-[r]-(m) WHERE n.name =~ "(?i).*糖尿病.*" OR m.name =~ "(?i).*糖尿病.*" RETURN DISTINCT n, r, m LIMIT 20';
          break;
        case 'food':
          cypher = 'MATCH (n:Food)-[r]-(m) RETURN DISTINCT n, r, m LIMIT 15';
          break;
        case 'all':
          cypher = 'MATCH (n)-[r]-(m) WHERE n:Disease OR n:Symptom OR n:Drug OR n:Food OR n:Check RETURN DISTINCT n, r, m LIMIT 20';
          break;
        default:
          cypher = 'MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 5';
      }
    }
    
    log(`构建的Cypher查询: ${cypher}`);
    return cypher;
  };
  
  // 导出图谱为图片
  const exportGraph = () => {
    if (!currentViz || !currentViz.network) {
      log('没有可导出的图谱', true);
      return;
    }
    
    try {
      // 获取网络的数据URL
      const dataUrl = currentViz.network.canvas.getContext().canvas.toDataURL('image/png');
      
      // 创建下载链接
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = 'knowledge-graph.png';
      
      // 触发下载
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      log('图谱已导出为PNG图片');
    } catch (error) {
      log(`导出图片失败: ${error.message}`, true);
    }
  };
  
  // 测试Neo4j连接
  const testNeo4jConnection = async () => {
    log('测试Neo4j连接并检查节点标签...');
    
    try {
      const driver = neo4j.driver(
        neo4jConfig.serverUrl,
        neo4j.auth.basic(neo4jConfig.serverUser, neo4jConfig.serverPassword)
      );
      
      const session = driver.session({
        database: neo4jConfig.database
      });
      
      try {
        // 1. 检查节点总数
        const countResult = await session.run('MATCH (n) RETURN count(n) AS count LIMIT 1');
        const count = countResult.records[0].get('count').toNumber();
        log(`连接成功! 数据库中有 ${count} 个节点`);
        
        // 2. 获取数据库中所有标签类型
        const labelsResult = await session.run('CALL db.labels()');
        const labels = labelsResult.records.map(record => record.get('label'));
        log(`数据库中存在的标签: ${labels.join(', ')}`);
        console.log("数据库标签列表:", labels);
        
        // 3. 检查标签节点数量
        if (labels.length > 0) {
          log("获取每个标签的节点数量:");
          for (const label of labels) {
            try {
              const labelCountResult = await session.run(`MATCH (n:${label}) RETURN count(n) AS count`);
              const labelCount = labelCountResult.records[0].get('count').toNumber();
              log(`- ${label}: ${labelCount}个节点`);
              
              // 获取该标签的一个样本节点查看属性
              const sampleNodeResult = await session.run(`MATCH (n:${label}) RETURN n LIMIT 1`);
              if (sampleNodeResult.records.length > 0) {
                const sampleNode = sampleNodeResult.records[0].get('n');
                console.log(`${label}标签节点样例:`, sampleNode.properties);
                
                // 输出可能用作显示名称的属性
                const nameProps = ['name', 'title', 'id', 'label', 'displayName'];
                const foundProps = nameProps.filter(prop => sampleNode.properties[prop] !== undefined);
                if (foundProps.length > 0) {
                  log(`${label}标签可能的显示名称属性: ${foundProps.join(', ')}`);
                }
              }
            } catch (err) {
              console.error(`获取${label}标签信息时出错:`, err);
            }
          }
        }
        
        // 4. 检查关系类型
        const relsResult = await session.run('CALL db.relationshipTypes()');
        const relationshipTypes = relsResult.records.map(record => record.get('relationshipType'));
        log(`数据库中存在的关系类型: ${relationshipTypes.join(', ')}`);
        console.log("关系类型列表:", relationshipTypes);
        
        return true;
      } catch (error) {
        log(`查询执行失败: ${error.message}`, true);
        return false;
      } finally {
        await session.close();
        await driver.close();
      }
    } catch (error) {
      log(`连接测试失败: ${error.message}`, true);
      console.error("连接错误详情:", error);
      return false;
    }
  };
  
  // 展开节点连接函数 - 类似Neo4j原生双击扩展功能
  const expandNodeConnections = async (nodeId, node, network, data) => {
    log(`开始展开节点 [${node.label}] 的连接...`);
    
    try {
      // 打开连接并创建会话
      const driver = neo4j.driver(
        neo4jConfig.serverUrl,
        neo4j.auth.basic(neo4jConfig.serverUser, neo4jConfig.serverPassword)
      );
      
      const session = driver.session({
        database: neo4jConfig.database
      });
      
      // 构建查询，获取与该节点相关的节点和关系，限制100个
      const query = `
        MATCH (n)-[r]-(m)
        WHERE ID(n) = ${nodeId}
        RETURN n, r, m
        LIMIT 100
      `;
      
      log(`执行节点扩展查询: ${query}`);
      
      // 执行查询
      const result = await session.run(query);
      log(`查询返回 ${result.records.length} 条记录`);
      
      // 如果没有返回记录，提示用户
      if (result.records.length === 0) {
        log(`节点 [${node.label}] 没有关联的节点`, true);
        await session.close();
        await driver.close();
        return;
      }
      
      // 用于存储新节点和关系
      const newNodes = new Map();
      const newEdges = new Map();
      
      // 记录当前节点和边的ID，避免重复
      const existingNodeIds = new Set(data.nodes.getIds());
      const existingEdgeIds = new Set(data.edges.getIds());
      
      // 处理返回的记录
      result.records.forEach((record, index) => {
        // 假设记录包含 n, r, m 三个字段
        if (record._fields && record._fields.length === 3) {
          const n = record._fields[0]; // 中心节点
          const r = record._fields[1]; // 关系
          const m = record._fields[2]; // 相关节点
          
          // 处理相关节点 m
          if (m && m.identity !== undefined) {
            const relatedNodeId = `neo-${m.identity}`;
            
            // 如果节点不存在，则添加
            if (!existingNodeIds.has(relatedNodeId) && !newNodes.has(relatedNodeId)) {
              // 获取标签
              const label = m.labels && m.labels.length > 0 ? m.labels[0] : 'Node';
              
              // 获取显示名称
              let displayName = relatedNodeId;
              if (m.properties) {
                displayName = m.properties.name || 
                             m.properties.title || 
                             m.properties.id || 
                             relatedNodeId.substring(0, 10);
              }
              
              // 使用相应标签的颜色
              const color = nodeColors[label] || '#6366f1';
              
              // 创建节点对象
              newNodes.set(relatedNodeId, {
                id: relatedNodeId,
                label: displayName,
                group: label,
                properties: m.properties,
                color: color,
                title: JSON.stringify(m.properties, null, 2),
                font: { color: '#000000' }
              });
              
              log(`添加新节点: ${displayName} (${label})`);
            }
          }
          
          // 处理关系 r
          if (r && r.identity !== undefined && r.type) {
            const relId = `rel-exp-${r.identity}`;
            
            // 如果关系不存在，则添加
            if (!existingEdgeIds.has(relId) && !newEdges.has(relId)) {
              const fromId = `neo-${r.start}`;
              const toId = `neo-${r.end}`;
              
              // 确保起始和目标节点存在
              if ((existingNodeIds.has(fromId) || newNodes.has(fromId)) && 
                  (existingNodeIds.has(toId) || newNodes.has(toId))) {
                
                // 创建关系对象
                newEdges.set(relId, {
                  id: relId,
                  from: fromId,
                  to: toId,
                  label: r.type,
                  arrows: 'to',
                  width: 2,
                  color: { color: '#848484' },
                  smooth: { enabled: true }
                });
                
                log(`添加新关系: ${r.type} (${fromId} -> ${toId})`);
              }
            }
          }
        }
      });
      
      // 关闭会话
      await session.close();
      await driver.close();
      
      // 将新节点和关系添加到网络
      if (newNodes.size > 0 || newEdges.size > 0) {
        // 添加新节点
        if (newNodes.size > 0) {
          data.nodes.add(Array.from(newNodes.values()));
        }
        
        // 添加新关系
        if (newEdges.size > 0) {
          data.edges.add(Array.from(newEdges.values()));
        }
        
        log(`已添加 ${newNodes.size} 个新节点和 ${newEdges.size} 条新关系`);
        
        // 重新应用物理引擎以优化布局
        network.setOptions({
          physics: {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
              gravitationalConstant: -1000,
              centralGravity: 0.1,
              springLength: 150,
              springConstant: 0.08,
              avoidOverlap: 0.8
            },
            stabilization: {
              enabled: true,
              iterations: 100,
              updateInterval: 10
            }
          }
        });
        
        // 开始物理引擎
        network.startSimulation();
        
        // 稍微缩小视图以适应新的图形
        setTimeout(() => {
          network.fit({ animation: true });
        }, 1000);
      } else {
        log(`未找到与节点 [${node.label}] 相关的新节点或关系`);
      }
    } catch (error) {
      log(`展开节点连接时出错: ${error.message}`, true);
      console.error("展开节点连接错误:", error);
    }
  };
  
  // 渲染测试图
  const renderTestGraph = () => {
    clearViz();
    log("开始渲染测试图...");
    
    try {
      // 创建简单测试数据
      const nodes = [
        { id: "n1", label: "糖尿病", group: "Disease", color: nodeColors["Disease"] },
        { id: "n2", label: "口渴", group: "Symptom", color: nodeColors["Symptom"] },
        { id: "n3", label: "胰岛素", group: "Drug", color: nodeColors["Drug"] },
        { id: "n4", label: "血糖检测", group: "Check", color: nodeColors["Check"] }
      ];
      
      const edges = [
        { id: "e1", from: "n1", to: "n2", label: "has_symptom", arrows: "to" },
        { id: "e2", from: "n1", to: "n3", label: "need_drug", arrows: "to" },
        { id: "e3", from: "n1", to: "n4", label: "need_check", arrows: "to" }
      ];
      
      // 添加额外的属性信息
      nodes.forEach(node => {
        node.properties = {
          name: node.label,
          desc: `这是一个${node.group}类型的节点，用于演示图谱`,
          id: node.id
        };
      });
      
      if (!vizRef.current) return;
      
      // 创建数据集
      const data = {
        nodes: new DataSet(nodes),
        edges: new DataSet(edges)
      };
      
      // 配置选项
      const options = {
        nodes: {
          shape: 'dot',
          size: 30,
          font: {
            size: 14,
            color: '#000000'
          },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          width: 2,
          color: { color: '#848484' },
          font: {
            size: 12,
            color: '#000000'
          },
          arrows: { to: { enabled: true } },
          smooth: { enabled: true }
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -500,
            centralGravity: 0.15,
            springLength: 150,
            springConstant: 0.1
          },
          stabilization: { enabled: true }
        },
        interaction: {
          hover: true,
          navigationButtons: true,
          tooltipDelay: 200
        }
      };
      
      // 创建网络
      const network = new Network(vizRef.current, data, options);
      setCurrentViz({ network });
      
      // 设置点击事件
      network.on('click', function(params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = data.nodes.get(nodeId);
          
          if (node) {
            log(`点击了节点: ${node.label || node.id}`);
            
            // 创建一个模拟的Neo4j节点对象
            const mockNeo4jNode = {
              labels: [node.group || 'Node'],
              properties: node.properties || { name: node.label }
            };
            
            showNodeInfo(mockNeo4jNode);
          }
        } else {
          closeNodeInfo();
        }
      });
      
      // 设置双击事件
      network.on('doubleClick', function(params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = data.nodes.get(nodeId);
          
          if (node) {
            log(`双击节点，准备展开: ${node.label || node.id}`);
            
            // 由于这是测试数据，我们使用特殊处理
            const testNodes = [
              { id: "test-1", label: "测试节点1", group: "Disease", properties: { name: "测试节点1" } },
              { id: "test-2", label: "测试节点2", group: "Symptom", properties: { name: "测试节点2" } },
              { id: "test-3", label: "测试节点3", group: "Drug", properties: { name: "测试节点3" } }
            ];
            
            const testEdges = [
              { id: "test-e1", from: nodeId, to: "test-1", label: "测试关系1", arrows: "to" },
              { id: "test-e2", from: nodeId, to: "test-2", label: "测试关系2", arrows: "to" },
              { id: "test-e3", from: nodeId, to: "test-3", label: "测试关系3", arrows: "to" }
            ];
            
            data.nodes.add(testNodes);
            data.edges.add(testEdges);
            
            log(`已添加 ${testNodes.length} 个测试节点和 ${testEdges.length} 条测试关系`);
            
            // 重新应用物理引擎
            network.setOptions({
              physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                  gravitationalConstant: -1000,
                  centralGravity: 0.1,
                  springLength: 150,
                  springConstant: 0.08
                }
              }
            });
            
            network.startSimulation();
          }
        }
      });
      
      log('测试图渲染成功');
    } catch (error) {
      log(`测试图渲染失败: ${error.message}`, true);
      console.error("测试图渲染错误:", error);
    }
  };
  
  // 从Neo4j渲染图谱
  const renderGraph = async () => {
    clearViz();
    log('开始渲染Neo4j图谱...');
    
    // 先测试连接
    const connectionOk = await testNeo4jConnection();
    if (!connectionOk) {
      log('Neo4j连接测试失败，请检查连接设置', true);
      return;
    }
    
    // 获取用户配置
    const cypher = getSelectedQuery();
    
    try {
      // 直接执行查询并手动构建数据
      const driver = neo4j.driver(
        neo4jConfig.serverUrl,
        neo4j.auth.basic(neo4jConfig.serverUser, neo4jConfig.serverPassword)
      );
      
      const session = driver.session({
        database: neo4jConfig.database
      });
      
      const result = await session.run(cypher);
      log(`查询返回 ${result.records.length} 条记录`);
      
      // 收集所有节点和边
      const nodesMap = new Map();
      const edgesMap = new Map();
      
      // 处理Neo4j查询结果
      result.records.forEach((record, recordIndex) => {
        if (record._fields) {
          record._fields.forEach((field, index) => {
            if (!field) return;
            
            // 尝试确定这是节点还是关系
            const isNode = field.labels !== undefined || 
                         (field.properties && (field.labels || field.elementType === 'node'));
            const isRelationship = field.type !== undefined || 
                                 (field.properties && field.startNodeElementId !== undefined && 
                                  field.endNodeElementId !== undefined);
            
            // 1. 处理节点
            if (isNode) {
              // 提取节点ID
              const nodeId = `neo-${field.identity || field.elementId || recordIndex + '-' + index}`;
              
              if (!nodesMap.has(nodeId)) {
                // 提取标签 - 适应不同的数据结构
                let labels = [];
                if (field.labels) {
                  labels = field.labels;
                } else if (field.elementType === 'node') {
                  labels = ['Node']; // 默认标签
                }
                
                // 获取节点标签和组
                let label = 'Node';
                let group = 'Node';
                
                if (labels && labels.length > 0) {
                  label = labels[0];
                  group = labels[0];
                }
                
                // 提取属性
                const properties = field.properties || {};
                
                // 获取显示名称（尝试多种属性）
                let displayName = nodeId;
                const nameProperties = ['name', 'title', 'label', 'id', 'displayName', 'desc'];
                
                for (const prop of nameProperties) {
                  if (properties[prop] !== undefined) {
                    displayName = properties[prop];
                    break;
                  }
                }
                
                // 确定节点颜色
                let nodeColor = nodeColors[group] || '#6366f1';
                
                // 添加到节点Map
                nodesMap.set(nodeId, {
                  id: nodeId,
                  label: displayName,
                  group: group,
                  properties: properties,
                  color: nodeColor,
                  title: JSON.stringify(properties, null, 2),
                  font: { color: '#000000' }
                });
              }
            }
            // 2. 处理关系
            else if (isRelationship) {
              // 提取关系ID
              const relId = `rel-${field.identity || field.elementId || recordIndex + '-' + index}`;
              
              if (!edgesMap.has(relId)) {
                // 提取起始和终止节点ID
                const fromId = `neo-${field.startNodeIdentity || field.startNodeElementId}`;
                const toId = `neo-${field.endNodeIdentity || field.endNodeElementId}`;
                
                // 提取关系类型
                const relType = field.type || 'RELATED_TO';
                
                // 提取属性
                const properties = field.properties || {};
                
                // 记录关系的起点和终点
                console.log(`关系 ${relId}(${relType}) 连接: ${fromId} -> ${toId}`);
                
                // 添加到边Map
                edgesMap.set(relId, {
                  id: relId,
                  from: fromId,
                  to: toId,
                  label: relType,
                  arrows: 'to',
                  properties: properties,
                  title: JSON.stringify(properties, null, 2),
                  color: { color: '#848484' },
                  width: 2,
                  smooth: { enabled: true }
                });
              }
            }
          });
        }
      });
      
      // 检查记录中的关系结构
      log("开始处理节点间关系...");
      
      result.records.forEach((record, i) => {
        if (record._fields && record._fields.length === 3) {
          const n = record._fields[0];
          const r = record._fields[1];
          const m = record._fields[2];
          
          if (n && r && m && r.type && r.start !== undefined && r.end !== undefined) {
            // 创建关系
            const relId = `rel-direct-${i}`;
            const fromId = `neo-${r.start}`;
            const toId = `neo-${r.end}`;
            
            console.log(`直接创建关系 ${relId}(${r.type}): ${fromId} -> ${toId}`);
            
            edgesMap.set(relId, {
              id: relId,
              from: fromId,
              to: toId,
              label: r.type,
              arrows: 'to',
              width: 2,
              color: { color: '#848484' },
              smooth: { enabled: true }
            });
          }
        }
      });
      
      await session.close();
      await driver.close();
      
      log(`最终处理得到 ${nodesMap.size} 个节点和 ${edgesMap.size} 条边`);
      
      // 如果没有获取到足够的数据，使用测试数据
      if (nodesMap.size < 2 || edgesMap.size < 1) {
        log("数据不足，使用测试数据渲染", true);
        renderTestGraph();
        return;
      }
      
      // 转换为数组
      const nodes = Array.from(nodesMap.values());
      const edges = Array.from(edgesMap.values());
      
      log(`处理得到 ${nodes.length} 个节点和 ${edges.length} 条边`);
      
      if (!vizRef.current) return;
      
      // 使用vis.js渲染
      const data = {
        nodes: new DataSet(nodes),
        edges: new DataSet(edges)
      };
      
      const options = {
        nodes: {
          shape: 'dot',
          size: 30,
          font: {
            size: 14,
            color: '#000000'
          },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          width: 2,
          color: { 
            color: '#848484' 
          },
          font: {
            size: 12,
            color: '#000000'
          },
          arrows: { 
            to: { 
              enabled: true,
              scaleFactor: 0.8
            } 
          },
          smooth: { 
            enabled: true,
            type: 'continuous',
            roundness: 0.5
          }
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -500,
            centralGravity: 0.15,
            springLength: 200,
            springConstant: 0.1,
            avoidOverlap: 0.5
          },
          stabilization: { 
            enabled: true,
            iterations: 1000
          }
        },
        interaction: {
          hover: true,
          navigationButtons: true,
          tooltipDelay: 200
        }
      };
      
      const network = new Network(vizRef.current, data, options);
      setCurrentViz({ network });
      
      // 设置点击事件
      network.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = data.nodes.get(nodeId);
          
          if (node) {
            log(`点击了节点: ${node.label || node.id}`);
            
            // 创建一个Neo4j节点对象
            const mockNeo4jNode = {
              labels: [node.group || 'Node'],
              properties: node.properties || { name: node.label }
            };
            
            showNodeInfo(mockNeo4jNode);
          }
        } else {
          closeNodeInfo();
        }
      });
      
      // 设置双击事件 - 展开节点关联
      network.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = data.nodes.get(nodeId);
          
          if (node) {
            log(`双击节点，准备展开: ${node.label || node.id}`);
            
            // 提取节点实际ID（去掉前缀）
            const actualId = nodeId.replace('neo-', '');
            
            // 调用展开节点函数
            expandNodeConnections(actualId, node, network, data);
          }
        }
      });
      
      // 检查节点位置
      network.once('stabilizationIterationsDone', () => {
        const nodePositions = {};
        const nodeIds = nodes.map(n => n.id);
        
        nodeIds.forEach(id => {
          const position = network.getPositions([id])[id];
          nodePositions[id] = position;
        });
        
        // 检查是否所有节点都在同一位置
        const uniquePositions = new Set();
        for (const id in nodePositions) {
          const pos = nodePositions[id];
          uniquePositions.add(`${Math.round(pos.x)},${Math.round(pos.y)}`);
        }
        
        if (uniquePositions.size === 1 && nodeIds.length > 1) {
          log("警告: 所有节点都在同一位置，尝试分散节点", true);
          
          // 随机分配节点位置
          nodeIds.forEach(id => {
            const randomX = Math.random() * 500 - 250;
            const randomY = Math.random() * 500 - 250;
            network.moveNode(id, randomX, randomY);
          });
          
          // 重新配置物理引擎
          network.setOptions({
            physics: {
              enabled: true,
              solver: 'repulsion',
              repulsion: {
                nodeDistance: 200,
                centralGravity: 0.1,
                springLength: 200,
                springConstant: 0.05
              }
            }
          });
          
          // 重新启动物理引擎
          network.startSimulation();
        }
      });
      
      log('Neo4j图谱渲染成功');
    } catch (error) {
      log(`渲染失败: ${error.message}`, true);
      console.error("渲染错误:", error);
      // 失败时使用测试数据
      renderTestGraph();
    }
  };
  
  // 切换全屏模式
  const toggleFullscreen = () => {
    // 全屏显示当前图谱
    if (!isFullscreen) {
      // 获取容器和数据
      if (currentViz && currentViz.network) {
        // 获取当前图谱数据
        const network = currentViz.network;
        
        try {
          // 将当前网络转换为全屏模式（直接使用浏览器API）
          const container = network.body.container;
          
          if (container.requestFullscreen) {
            container.requestFullscreen();
          } else if (container.webkitRequestFullscreen) { /* Safari */
            container.webkitRequestFullscreen();
          } else if (container.msRequestFullscreen) { /* IE11 */
            container.msRequestFullscreen();
          }
          
          log("已进入全屏模式");
        } catch (e) {
          log(`全屏显示失败: ${e.message}`, true);
        }
      } else {
        log("没有可以全屏显示的图谱", true);
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  // 检查全屏状态变化
  useEffect(() => {
    const onFullscreenChange = () => {
      const isFullscreenNow = 
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement;
      
      // 只有当状态不匹配时才更新
      if ((!!isFullscreenNow) !== isFullscreen) {
        setIsFullscreen(!!isFullscreenNow);
      }
    };
    
    // 添加全屏变化事件监听
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);
    
    return () => {
      // 移除事件监听
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, [isFullscreen]);
  
  // 组件挂载时的处理
  useEffect(() => {
    // 如果有初始搜索词或查询类型，则自动渲染图谱
    if (autoRender && (initialSearchTerm || initialQueryType !== 'basic')) {
      setTimeout(renderGraph, 500);
    } else {
      // 否则渲染测试图
      setTimeout(renderTestGraph, 500);
    }
    
    // 清理函数
    return () => {
      if (currentViz && currentViz.network) {
        currentViz.network.destroy();
      }
    };
  }, [autoRender, initialSearchTerm, initialQueryType]);
  
  return (
    <div style={styles.container}>
      <div style={styles.configPanel}>
        <div style={styles.configContent}>
          <input 
            type="text" 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索词，例如：糖尿病、头痛"
          />
          
          <div style={styles.selectContainer}>
            <select 
              style={styles.select}
              value={queryType}
              onChange={(e) => setQueryType(e.target.value)}
            >
              <option value="basic">基础节点查询</option>
              <option value="relationships">节点关系查询</option>
              <option value="disease">疾病相关查询</option>
              <option value="diabetes">糖尿病相关查询</option>
              <option value="food">食物相关查询</option>
              <option value="all">查询所有类型节点</option>
            </select>
          </div>
          
          <div style={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              id="show-labels" 
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              style={{width: '18px', height: '18px'}}
            />
            <label htmlFor="show-labels" style={{fontSize: '14px'}}>显示标签</label>
          </div>
          
          <div style={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              id="show-relationships" 
              checked={showRelationships}
              onChange={(e) => setShowRelationships(e.target.checked)}
              style={{width: '18px', height: '18px'}}
            />
            <label htmlFor="show-relationships" style={{fontSize: '14px'}}>显示关系</label>
          </div>
        </div>
        
        <div style={{...styles.controls, marginTop: '16px', marginBottom: '0'}}>
          <button style={styles.button} onClick={renderGraph}>
            渲染图谱
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={exportGraph}>
            导出图片
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={clearViz}>
            清除图谱
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={renderTestGraph}>
            测试图
          </button>
          <button 
            style={{...styles.button, ...styles.secondaryButton}} 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
          >
            {showDebugPanel ? '隐藏日志' : '显示日志'}
          </button>
        </div>
      </div>
      
      <div style={styles.vizContainer}>
        <div style={styles.viz} ref={vizRef}></div>
        
        <button 
          style={styles.fullscreenButton} 
          onClick={toggleFullscreen}
          title="全屏显示"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        
        <div style={styles.infoTip}>
          <b>提示：</b> 双击任意节点可以展开其关联节点
        </div>
        
        <div style={styles.nodeInfoPanel} ref={nodeInfoPanelRef}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>节点属性</h3>
            <button style={styles.closeButton} onClick={closeNodeInfo}>×</button>
          </div>
          <div ref={nodeInfoContentRef}></div>
        </div>
      </div>
      
      {showDebugPanel && (
        <div style={styles.debug}>
          <h3 style={styles.debugTitle}>操作日志</h3>
          <div style={styles.logContainer}>
            {logs.map((log, i) => (
              <p 
                key={i} 
                style={log.isError ? styles.error : styles.info}
              >
                {log.time}: {log.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Neo4jGraphVisualization;
