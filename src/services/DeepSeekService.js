// DeepSeekService.js
// Service for interacting with the DeepSeek API

// DeepSeek API URL
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1';

// 将您的 API 密钥存储在环境变量中（更安全）
// 实际使用时应当从环境变量获取
let DEEPSEEK_API_KEY = '';

/**
 * 设置 DeepSeek API 密钥
 * @param {string} apiKey - DeepSeek API 密钥
 */
export function setApiKey(apiKey) {
  DEEPSEEK_API_KEY = apiKey;
}

/**
 * 检查是否设置了 API 密钥
 * @returns {boolean} - 是否设置了 API 密钥
 */
export function hasApiKey() {
  return DEEPSEEK_API_KEY !== '';
}

/**
 * 调用 DeepSeek API 生成回答
 * @param {string} prompt - 提示词
 * @param {Object} options - 可选参数
 * @returns {Promise<string>} - 生成的回答
 */
export async function generateResponse(prompt, options = {}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not set');
  }

  const {
    model = 'deepseek-chat', // 默认模型
    temperature = 0.7,
    maxTokens = 2048,
    stream = false,
  } = options;

  try {
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API call failed:', error);
    throw error;
  }
}

/**
 * 生成流式响应
 * @param {string} prompt - 提示词
 * @param {Object} options - 可选参数
 * @param {Function} onChunk - 每个响应块的回调函数
 * @param {Function} onComplete - 响应完成时的回调函数
 * @param {Function} onError - 出错时的回调函数
 */
export function generateStreamingResponse(
  prompt,
  options = {},
  onChunk = () => {},
  onComplete = () => {},
  onError = () => {}
) {
  if (!DEEPSEEK_API_KEY) {
    onError(new Error('DeepSeek API key is not set'));
    return;
  }

  const {
    model = 'deepseek-chat',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  // 创建请求体
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  // 使用 fetch 处理流式响应
  fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body,
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      function processStream({ done, value }) {
        if (done) {
          onComplete(fullResponse);
          return;
        }

        // 解码每个块
        const chunk = decoder.decode(value, { stream: true });
        
        try {
          // 每个数据块由 data: 前缀开始，可能包含多行
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            // 忽略空行和 [DONE] 消息
            if (!line.trim() || line.includes('[DONE]')) continue;
            
            // 删除 "data: " 前缀
            const jsonLine = line.replace(/^data: /, '').trim();
            if (!jsonLine) continue;
            
            const data = JSON.parse(jsonLine);
            
            // 从响应中提取内容
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullResponse += content;
              onChunk(content);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }

        // 继续读取
        reader.read().then(processStream);
      }

      reader.read().then(processStream);
    })
    .catch(error => {
      console.error('Streaming API call failed:', error);
      onError(error);
    });
}

/**
 * 获取可用的 DeepSeek 模型列表
 * @returns {Promise<Array>} - 可用模型列表
 */
export async function getModels() {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not set');
  }

  try {
    const response = await fetch(`${DEEPSEEK_API_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || []; // 返回模型列表
  } catch (error) {
    console.error('Failed to get models:', error);
    throw error;
  }
}

// 导出默认对象
const DeepSeekService = {
  setApiKey,
  hasApiKey,
  generateResponse,
  generateStreamingResponse,
  getModels,
};

export default DeepSeekService;