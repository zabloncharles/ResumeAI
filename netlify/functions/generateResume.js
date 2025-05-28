// Removed: const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let profession = '';
  let summary = '';
  let section = '';
  try {
    const body = JSON.parse(event.body);
    profession = body.profession || '';
    summary = body.summary || '';
    section = body.section || '';
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key not configured' })
    };
  }

  let userPrompt = '';
  if (section === 'personal') {
    userPrompt = `Generate 5 ways to improve a resume for the job title: ${profession}. Each should be concise, compelling, and tailored for a resume. Return as bullet points.`;
  } else if (section === 'summary') {
    if (summary && summary.trim().length > 0) {
      userPrompt = `Rewrite the following professional summary to make it more compelling, concise, and professional. Provide 5 improved versions as bullet points.\n\nSummary: ${summary.trim()}`;
    } else if (profession && profession.trim().length > 0) {
      userPrompt = `Generate 5 impactful resume bullet points for the job title: ${profession}. Each bullet should describe a specific achievement, responsibility, or result that would impress a recruiter and help land an interview. Use action verbs, quantify results where possible, and keep each point concise and professional. Return as bullet points.`;
    } else {
      userPrompt = `Generate 5 professional summary statements for a resume. Each should be concise, compelling, and tailored for a resume. Return as bullet points.`;
    }
  } else if (section === 'employment') {
    userPrompt = `Generate 5 bullet points describing what the person did at the job. Each bullet should describe a specific achievement, responsibility, or result that would impress a recruiter and help land an interview. Use action verbs, quantify results where possible, and keep each point concise and professional. Return as bullet points.`;
  } else {
    userPrompt = `Generate 5 professional summary statements for a resume. Each should be concise, compelling, and tailored for a resume. Return as bullet points.`;
  }

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
            content: userPrompt
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
    // The OpenAI response is in data.choices[0].message.content
    const content = data.choices?.[0]?.message?.content || '';
    return {
      statusCode: 200,
      body: JSON.stringify({ content })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to generate suggestions' })
    };
  }
}; 