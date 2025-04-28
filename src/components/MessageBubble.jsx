import React from 'react';
import './MessageBubble.css';

// Icon for the AI assistant
const AIIcon = () => (
  <div className="ai-icon">
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="#646cff" strokeWidth="2" />
      <path d="M12 20L18 26L28 16" stroke="#646cff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

// Icon for the user
const UserIcon = () => (
  <div className="user-icon">
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="#6b7280" strokeWidth="2" />
      <circle cx="20" cy="17" r="5" stroke="#6b7280" strokeWidth="2" />
      <path d="M10 30.5C10 25.5 14.5 21.5 20 21.5C25.5 21.5 30 25.5 30 30.5" stroke="#6b7280" strokeWidth="2" />
    </svg>
  </div>
);

// 增强的 Markdown 渲染组件
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  
  // 处理原始文本，支持更多Markdown格式
  const processText = (rawText) => {
    // 预处理：处理Unicode表情等特殊字符
    const processedText = rawText
      // 保留emoji和特殊字符
      .replace(/⚠️/g, '⚠️ ');
      
    return processedText;
  };
  
  // 处理主文本
  const processedText = processText(text);
  
  // 将文本分割成段落
  const paragraphs = processedText.split('\n\n').filter(p => p.trim());
  
  // 处理表格 - 将表格相关的段落组合在一起
  const combinedParagraphs = [];
  let tableContent = null;
  
  paragraphs.forEach(para => {
    // 检测表格行 (包含 | 字符的行)
    if (para.includes('|') && para.trim().startsWith('|') && para.trim().endsWith('|')) {
      if (tableContent === null) {
        tableContent = para;
      } else {
        tableContent += '\n' + para;
      }
    } else {
      if (tableContent !== null) {
        combinedParagraphs.push(tableContent);
        tableContent = null;
      }
      combinedParagraphs.push(para);
    }
  });
  
  // 处理最后一个表格（如果有）
  if (tableContent !== null) {
    combinedParagraphs.push(tableContent);
  }
  
  return (
    <div className="markdown-content">
      {combinedParagraphs.map((paragraph, index) => {
        // 处理多种类型的标题 (# 或 ####)
        if (paragraph.startsWith('# ') || paragraph.startsWith('## ') || 
            paragraph.startsWith('### ') || paragraph.startsWith('#### ') || 
            paragraph.startsWith('##### ') || paragraph.startsWith('###### ')) {
          const level = paragraph.indexOf(' ');
          const headerText = paragraph.substring(level + 1);
          
          // 根据#的数量创建对应级别的标题
          switch (level) {
            case 1: return <h1 key={index}>{headerText}</h1>;
            case 2: return <h2 key={index}>{headerText}</h2>;
            case 3: return <h3 key={index}>{headerText}</h3>;
            case 4: return <h4 key={index}>{headerText}</h4>;
            case 5: return <h5 key={index}>{headerText}</h5>;
            default: return <h6 key={index}>{headerText}</h6>;
          }
        }
        
        // 处理表格
        else if (paragraph.includes('|') && paragraph.trim().startsWith('|') && paragraph.trim().endsWith('|')) {
          const rows = paragraph.split('\n');
          return (
            <div className="table-container" key={index}>
              <table className="markdown-table">
                <tbody>
                  {rows.map((row, rowIndex) => {
                    // 跳过分隔行 (包含 ----- 的行)
                    if (row.includes('-----')) return null;
                    
                    // 提取单元格内容
                    const cells = row.split('|')
                      .filter(cell => cell.trim() !== '') // 移除空单元格
                      .map(cell => cell.trim());
                    
                    return (
                      <tr key={rowIndex}>
                        {cells.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }
        
        // 处理列表
        else if (paragraph.includes('\n- ')) {
          const parts = paragraph.split('\n- ');
          const hasPrefixText = !paragraph.startsWith('- ');
          const prefixText = hasPrefixText ? parts[0] : '';
          const listItems = hasPrefixText ? parts.slice(1) : parts;
          
          return (
            <div key={index}>
              {prefixText && <p>{prefixText}</p>}
              <ul>
                {listItems.map((item, i) => (
                  item.trim() ? <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} /> : null
                ))}
              </ul>
            </div>
          );
        }
        
        // 处理单行列表项
        else if (paragraph.startsWith('- ')) {
          return (
            <ul key={index}>
              <li dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(paragraph.substring(2)) }} />
            </ul>
          );
        }
        
        // 处理代码块
        else if (paragraph.startsWith('```') && paragraph.endsWith('```')) {
          const code = paragraph.substring(3, paragraph.length - 3);
          return (
            <pre key={index} className="code-block">
              <code>{code}</code>
            </pre>
          );
        }
        
        // 处理段落内的富文本格式
        else {
          return <p key={index} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(paragraph) }} />;
        }
      })}
    </div>
  );
};

// 处理行内Markdown格式 (加粗、斜体、代码等)
const formatInlineMarkdown = (text) => {
  if (!text) return '';
  
  let formattedText = text;
  
  // 处理行内代码 `代码`
  formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理加粗文本 **文本**
  formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 处理斜体文本 *文本* (避免与加粗冲突)
  formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // 处理星号评分 (★, ★★, ★★★, ★★★★)
  formattedText = formattedText.replace(/★★★★/g, '<span class="rating rating-4">★★★★</span>');
  formattedText = formattedText.replace(/★★★/g, '<span class="rating rating-3">★★★</span>');
  formattedText = formattedText.replace(/★★/g, '<span class="rating rating-2">★★</span>');
  formattedText = formattedText.replace(/★/g, '<span class="rating rating-1">★</span>');
  
  return formattedText;
};

// Message bubble component with markdown support
const MessageBubble = ({ message, isUser }) => {
  return (
    <div className={`message-container ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-icon">
        {isUser ? <UserIcon /> : <AIIcon />}
      </div>
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
        <div className="message-content">
          {isUser ? (
            <span>{message}</span>
          ) : (
            <MarkdownRenderer text={message} />
          )}
        </div>
      </div>
    </div>
  );
};

// Loading indicator for AI responses
export const LoadingIndicator = () => {
  return (
    <div className="message-container ai-message">
      <div className="message-icon">
        <AIIcon />
      </div>
      <div className="message-bubble ai-bubble loading-bubble">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;