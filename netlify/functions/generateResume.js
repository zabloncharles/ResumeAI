// Removed: const fetch = require('node-fetch');

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

  let { prompt } = body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No prompt provided.' })
    };
  }

  let profession = '';
  let summary = '';
  let section = '';
  try {
    profession = body.profession || '';
    summary = body.summary || '';
    section = body.section || '';
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  if (section === 'personal' && (!profession || profession.trim().length === 0)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Please provide a job title in the personal information section.' })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key not configured' })
    };
  }

  console.log('Section:', section);
  console.log('Profession:', profession);
  console.log('Debug - Section:', section);
  console.log('Debug - Profession:', profession);

  const generatePersonalSuggestions = (profession) => {
    if (!profession || profession.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please provide a job title in the personal information section.' })
      };
    }
    return `List 5 essential tips for creating a professional resume for a ${profession}. Each tip should be clear, actionable, and specifically helpful for someone seeking a ${profession} position. Return as bullet points.`;
  };

  const generateSummarySuggestions = (profession) => {
    if (!profession || profession.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please provide a job title in the personal information section to get suggestions.' })
      };
    }
    return `Generate 5 professional summary statements tailored for a ${profession}. Each summary should be concise, compelling, and highlight the candidate's strengths for this role. Focus on their overall professional identity, key skills, and career goals. Return as bullet points.`;
  };

  const generateEmploymentSuggestions = (profession) => {
    return `Given the job title: ${profession}, generate 5 impactful resume bullet points describing achievements, responsibilities, or results that would impress a recruiter. Use action verbs, quantify results where possible, and keep each point concise. Return as bullet points.`;
  };

  console.log('Debug - Prompt:', prompt);

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
          {
            role: 'system',
            content: `You are an expert resume writer and career coach. Focus on:\n1. Professional, concise, and compelling language\n2. Resume-appropriate tone\n3. Action-oriented and achievement-focused statements\n4. For employment history, focus on bullet points that describe what the candidate did at the job that would help them land an interview. Use action verbs and quantify results where possible.\nReturn only the 5 best bullet points as bullet points.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: errorData.error?.message || 'Failed to generate suggestions' })
      };
    }

    const data = await response.json();
    // Debug log to check the output returned
    console.log('Debug - API Response:', data);
    // The OpenAI response is in data.choices[0].message.content
    const content = data.choices?.[0]?.message?.content || '';
    const total_tokens = data.usage?.total_tokens || 0;
    return {
      statusCode: 200,
      body: JSON.stringify({ content, total_tokens })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to generate suggestions' })
    };
  }
}; 