import React, { useState, useEffect } from 'react';
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

// 简单的 Markdown 渲染组件
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  
  // 处理文本，转换 Markdown 为 HTML
  const renderMarkdown = (markdownText) => {
    // 分割文本为段落
    const paragraphs = markdownText.split('\n\n');
    
    return (
      <>
        {paragraphs.map((paragraph, index) => {
          // 跳过空段落
          if (!paragraph.trim()) return null;
          
          // 处理标题 (# 标题)
          if (paragraph.startsWith('# ')) {
            return <h1 key={index}>{paragraph.substring(2)}</h1>;
          } else if (paragraph.startsWith('## ')) {
            return <h2 key={index}>{paragraph.substring(3)}</h2>;
          } else if (paragraph.startsWith('### ')) {
            return <h3 key={index}>{paragraph.substring(4)}</h3>;
          } else if (paragraph.startsWith('#### ')) {
            return <h4 key={index}>{paragraph.substring(5)}</h4>;
          } else if (paragraph.startsWith('##### ')) {
            return <h5 key={index}>{paragraph.substring(6)}</h5>;
          }
          
          // 处理表格
          else if (paragraph.includes('|') && paragraph.includes('\n') && paragraph.trim().startsWith('|')) {
            const rows = paragraph.split('\n').filter(row => !row.includes('---'));
            
            return (
              <div className="table-container" key={index}>
                <table className="markdown-table">
                  <tbody>
                    {rows.map((row, rowIndex) => {
                      const cells = row.split('|')
                        .filter(cell => cell.trim() !== '')
                        .map(cell => cell.trim());
                      
                      return (
                        <tr key={rowIndex}>
                          {cells.map((cell, cellIndex) => (
                            <td key={cellIndex}>{formatInlineMarkdown(cell)}</td>
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
            const lines = paragraph.split('\n');
            const listItems = [];
            let currentText = '';
            
            lines.forEach(line => {
              if (line.startsWith('- ')) {
                if (currentText) {
                  listItems.push(<p key={`p-${listItems.length}`}>{formatInlineMarkdown(currentText)}</p>);
                  currentText = '';
                }
                listItems.push(
                  <li key={`li-${listItems.length}`}>
                    {formatInlineMarkdown(line.substring(2))}
                  </li>
                );
              } else {
                currentText += (currentText ? '\n' : '') + line;
              }
            });
            
            return (
              <div key={index}>
                {currentText && <p>{formatInlineMarkdown(currentText)}</p>}
                <ul>{listItems.filter(item => item.type === 'li')}</ul>
              </div>
            );
          }
          
          // 处理单行列表项
          else if (paragraph.startsWith('- ')) {
            return (
              <ul key={index}>
                <li>{formatInlineMarkdown(paragraph.substring(2))}</li>
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
          
          // 处理普通段落
          else {
            return <p key={index}>{formatInlineMarkdown(paragraph)}</p>;
          }
        })}
      </>
    );
  };
  
  // 格式化行内 Markdown
  const formatInlineMarkdown = (text) => {
    if (!text) return '';
    
    // 使用 React 元素数组替代 HTML 字符串
    const segments = [];
    
    // 处理特殊字符
    let processedText = text;
    
    // 处理加粗 **text**
    let boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    let tempText = processedText;
    
    while ((match = boldRegex.exec(tempText)) !== null) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        segments.push(tempText.substring(lastIndex, match.index));
      }
      
      // 添加加粗文本
      segments.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余文本
    if (lastIndex < tempText.length) {
      segments.push(tempText.substring(lastIndex));
    }
    
    // 警告符号特殊处理
    if (processedText.includes('⚠️')) {
      return <span className="warning-item">{segments.length > 0 ? segments : processedText}</span>;
    }
    
    // 星号评分特殊处理
    if (processedText.includes('★')) {
      if (processedText.includes('★★★★')) {
        return <span className="rating rating-4">★★★★</span>;
      } else if (processedText.includes('★★★')) {
        return <span className="rating rating-3">★★★</span>;
      } else if (processedText.includes('★★')) {
        return <span className="rating rating-2">★★</span>;
      } else if (processedText.includes('★')) {
        return <span className="rating rating-1">★</span>;
      }
    }
    
    return segments.length > 0 ? segments : processedText;
  };
  
  return (
    <div className="markdown-content">
      {renderMarkdown(text)}
    </div>
  );
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