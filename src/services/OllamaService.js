// OllamaService.js
// Service for interacting with the Ollama API

// Default Ollama API endpoint
const OLLAMA_API_URL = 'http://localhost:11434/api';

// Default model to use
const DEFAULT_MODEL = 'llama3';

// Set a timeout for API requests (5 seconds)
const REQUEST_TIMEOUT = 5000;

/**
 * Helper to create a promise with timeout
 * 
 * @param {Promise} promise - The original promise
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} - Promise with timeout
 */
function promiseWithTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

/**
 * Call the Ollama API to generate a response to a prompt
 *
 * @param {string} prompt - The prompt to send to the model
 * @param {object} options - Additional options for the API call
 * @returns {Promise<string>} - The model's response
 */
export async function generateResponse(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    stream = false,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  try {
    const response = await promiseWithTimeout(
      fetch(`${OLLAMA_API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
      }),
      REQUEST_TIMEOUT
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama API call failed:', error);
    throw error;
  }
}

/**
 * Get a list of available models from the Ollama API
 * 
 * @returns {Promise<Array>} - List of available models
 */
export async function getModels() {
  try {
    const response = await promiseWithTimeout(
      fetch(`${OLLAMA_API_URL}/tags`),
      REQUEST_TIMEOUT
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Failed to get models:', error);
    throw error;
  }
}

/**
 * Generate a streaming response from the Ollama API
 * 
 * @param {string} prompt - The prompt to send to the model
 * @param {object} options - Additional options for the API call
 * @param {function} onChunk - Callback for each chunk of the response
 * @param {function} onComplete - Callback when the response is complete
 * @param {function} onError - Callback for errors
 */
export function generateStreamingResponse(
  prompt,
  options = {},
  onChunk = () => {},
  onComplete = () => {},
  onError = () => {}
) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  // Create the request body
  const body = JSON.stringify({
    model,
    prompt,
    stream: true,
    options: {
      temperature,
      num_predict: maxTokens,
    },
  });

  // Create an AbortController to handle timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  // Use fetch with a reader to handle the streaming response
  fetch(`${OLLAMA_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    signal: controller.signal
  })
    .then(response => {
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
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

        // Decode the chunk and parse it
        const chunk = decoder.decode(value, { stream: true });
        try {
          // Each line is a separate JSON object
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const data = JSON.parse(line);
            
            if (data.response) {
              fullResponse += data.response;
              onChunk(data.response);
            }
            
            // Check if this is the final message
            if (data.done) {
              onComplete(fullResponse);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }

        // Continue reading
        reader.read().then(processStream);
      }

      reader.read().then(processStream);
    })
    .catch(error => {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      
      console.error('Streaming API call failed:', error);
      onError(error);
    });
}

// Export default object for easier imports
const OllamaService = {
  generateResponse,
  generateStreamingResponse,
  getModels,
};

export default OllamaService;