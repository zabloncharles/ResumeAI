exports.handler = async (event) => {
  let debugLog = [];
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { text } = JSON.parse(event.body);
    debugLog.push({ step: 'Received text', text });
    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No resume text provided.', debugLog }),
      };
    }

    // ResumeData schema for the AI
    const schema = `{
  personalInfo: {
    fullName: string,
    title: string,
    email: string,
    phone: string,
    location: string,
    photo: string
  },
  profile: string,
  experience: Array<{
    title: string,
    company: string,
    startDate: string,
    endDate: string,
    description: string[]
  }>,
  education: Array<{
    degree: string,
    school: string,
    startDate: string,
    endDate: string
  }>,
  websites: Array<{
    label: string,
    url: string
  }>
}`;

    const prompt = `You are a resume assistant. Given the following resume text, extract all relevant information, improve the content for clarity and professionalism, and return the result as a JSON object matching this schema (do not include any explanation, just the JSON):\n\nSchema: ${schema}\n\nResume:\n${text}`;
    debugLog.push({ step: 'Prompt', prompt });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OpenAI API key not configured', debugLog }),
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-16k',
        messages: [
          { role: 'system', content: 'You are a helpful resume assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      debugLog.push({ step: 'OpenAI API error', error: errorData });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: errorData.error?.message || 'Failed to contact OpenAI', debugLog }),
      };
    }

    const data = await response.json();
    debugLog.push({ step: 'OpenAI API response', data });
    const aiResponse = data.choices?.[0]?.message?.content || '';
    debugLog.push({ step: 'AI Response', aiResponse });
    let jsonStart = aiResponse.indexOf('{');
    let jsonEnd = aiResponse.lastIndexOf('}');
    let jsonString = aiResponse.substring(jsonStart, jsonEnd + 1);
    debugLog.push({ step: 'Extracted JSON string', jsonString });
    let resumeJson;
    try {
      resumeJson = JSON.parse(jsonString);
    } catch (e) {
      debugLog.push({ step: 'JSON parse error', error: e.message });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI did not return valid JSON.', debugLog }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resumeJson),
    };
  } catch (error) {
    debugLog.push({ step: 'General error', error: error.message });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, debugLog }),
    };
  }
}; 