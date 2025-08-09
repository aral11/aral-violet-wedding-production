import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const { httpMethod, path, body } = event;

  // Enable CORS for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Return graceful fallbacks for API endpoints
  // In production, this would connect to your actual backend
  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'API endpoint available - static mode',
        path: path,
        method: httpMethod,
        fallback: true
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        fallback: true 
      }),
    };
  }
};
