exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const { profession } = body || {};
  if (!profession || typeof profession !== 'string' || profession.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No profession provided.' })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key not configured' })
    };
  }

  const prompt = `You are a career coach and job market expert. For someone who wants to become a ${profession}, provide a step-by-step wireframe of what they need to do to get a job in this field. For each step, include a title, a brief description, and if relevant, a list of recommended online courses or certifications (with provider and a real or plausible URL). Format the response as a JSON array of steps, each with: title, description, and links (array of {label, url}).`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI career assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 900
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: errorData.error?.message || 'Failed to generate career path' })
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    // Try to parse the JSON array from the AI response
    let steps = [];
    try {
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']');
      steps = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI did not return valid JSON.' })
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ steps })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to generate career path' })
    };
  }
}; 