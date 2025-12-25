const GEMINI_API_KEY = 'AIzaSyAx4QnaJy9_QearhV_irwB-Fy4KmkAux8E';

// List of models to try in order (fallback mechanism)
const MODEL_OPTIONS = [
  'gemini-2.5-flash',  // Newest, fastest
  'gemini-2.5-pro',    // Newest, more capable
  'gemini-1.5-flash',  // Older but might still work
  'gemini-1.5-pro',    // Older but might still work
  'gemini-pro',        // Legacy model
];

const getModelUrl = (model: string, version: string = 'v1beta') => {
  return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
};

export interface AIAction {
  action: 'mark_attendance' | 'edit_student' | 'view_student' | 'unknown';
  student_name?: string;
  department?: string;
  status?: 'present' | 'absent' | 'late' | 'excused';
  student_id?: string;
  date?: string;
  confidence: number;
  message?: string;
}

export interface StudentData {
  id: string;
  name: string;
  email: string;
  department: string | null;
  department_id?: string;
}

export interface AIContext {
  students: StudentData[];
  currentDate: string;
  availableActions: string[];
}

export interface AnalyticsData {
  attendance?: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    prediction: number;
    insights: string[];
  };
  finance?: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    prediction: number;
    insights: string[];
  };
  students?: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    prediction: number;
    insights: string[];
  };
}

export interface DataQueryIntent {
  queryType: 'attendance_check' | 'student_count' | 'attendance_list' | 'student_info' | 'general';
  student_name?: string;
  department?: string;
  date?: string;
  status?: string;
  confidence: number;
}

async function tryGeminiModel(
  model: string,
  systemPrompt: string,
  apiVersion: string = 'v1beta'
): Promise<any> {
  const url = `${getModelUrl(model, apiVersion)}?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || response.statusText);
  }

  return await response.json();
}

export async function callGeminiAPI(
  prompt: string,
  context: AIContext
): Promise<AIAction> {
  const systemPrompt = `You are an AI assistant for a school ERP system. Parse natural language commands and return ONLY valid JSON, no markdown, no explanations.

Available actions:
1. mark_attendance - Mark attendance (status: present, absent, late, excused)
2. edit_student - Edit student info
3. view_student - View student info
4. unknown - Unclear command

Available students:
${context.students.length > 0 ? context.students.map(s => `- ${s.name} (ID: ${s.id}, Department: ${s.department || 'N/A'})`).join('\n') : 'No students available'}

Current date: ${context.currentDate}

Return ONLY this JSON structure (no markdown, no code blocks):
{"action":"mark_attendance","student_name":"Laxman","department":"BSC Comp Science","status":"absent","confidence":0.95,"message":"Mark Laxman as absent"}

Examples:
Input: "mark Laxman from department BSC Comp Science as absent"
Output: {"action":"mark_attendance","student_name":"Laxman","department":"BSC Comp Science","status":"absent","confidence":0.95,"message":"Mark Laxman as absent"}

Input: "mark John as present"
Output: {"action":"mark_attendance","student_name":"John","status":"present","confidence":0.9,"message":"Mark John as present"}

Now parse: ${prompt}`;

  // Try models in order until one works
  let lastError: Error | null = null;
  
  for (const model of MODEL_OPTIONS) {
    try {
      // Try v1beta first
      const data = await tryGeminiModel(model, systemPrompt, 'v1beta');
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (text) {
        // Success! Parse the response
        return parseAIResponse(text, context);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // If model not found, try next one
      if (lastError.message.includes('not found') || lastError.message.includes('not supported')) {
        continue;
      }
      // For other errors, break and return error
      break;
    }
  }

  // If all models failed, try v1 API with gemini-pro
  try {
    const data = await tryGeminiModel('gemini-pro', systemPrompt, 'v1');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) {
      return parseAIResponse(text, context);
    }
  } catch (error) {
    // Ignore and use last error
  }

  // All attempts failed
  throw lastError || new Error('All Gemini models failed');
}

// New function to parse data query intent
export async function parseDataQueryIntent(
  prompt: string,
  students: StudentData[],
  currentDate: string
): Promise<DataQueryIntent> {
  const systemPrompt = `You are an AI assistant that understands questions about school data. Parse the question and return ONLY valid JSON, no markdown, no explanations.

Available students:
${students.length > 0 ? students.map(s => `- ${s.name} (ID: ${s.id}, Department: ${s.department || 'N/A'})`).join('\n') : 'No students available'}

Current date: ${currentDate}

Query types:
1. attendance_check - Check if a student is present/absent on a specific date (e.g., "is laxman present today")
2. student_count - Count students by department or criteria (e.g., "how many students in bsc comp sci")
3. attendance_list - List attendance for multiple students
4. student_info - Get information about a student
5. general - Other queries

Return ONLY this JSON structure (no markdown, no code blocks):
{"queryType":"attendance_check","student_name":"Laxman","date":"2024-01-15","confidence":0.95}

Examples:
Input: "is laxman present today"
Output: {"queryType":"attendance_check","student_name":"Laxman","date":"${currentDate}","confidence":0.9}

Input: "how many students are there in bsc comp science"
Output: {"queryType":"student_count","department":"BSC Comp Science","confidence":0.95}

Input: "show me students in computer science"
Output: {"queryType":"student_count","department":"Computer Science","confidence":0.85}

Now parse: ${prompt}`;

  let lastError: Error | null = null;
  
  for (const model of MODEL_OPTIONS) {
    try {
      const data = await tryGeminiModel(model, systemPrompt, 'v1beta');
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (text) {
        let jsonText = text.trim();
        
        // Extract JSON
        if (jsonText.includes('```')) {
          const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) jsonText = jsonMatch[1];
        } else {
          const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) jsonText = jsonObjectMatch[0];
        }

        const parsed = JSON.parse(jsonText);
        
        // Find student by name if provided
        if (parsed.student_name) {
          const matchingStudents = students.filter(
            s => s.name.toLowerCase().includes(parsed.student_name.toLowerCase())
          );
          if (matchingStudents.length === 1) {
            parsed.student_id = matchingStudents[0].id;
            parsed.student_name = matchingStudents[0].name;
          }
        }

        return {
          queryType: parsed.queryType || 'general',
          student_name: parsed.student_name,
          department: parsed.department,
          date: parsed.date || currentDate,
          status: parsed.status,
          confidence: parsed.confidence || 0.5,
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message.includes('not found') || lastError.message.includes('not supported')) {
        continue;
      }
      break;
    }
  }

  // Fallback
  try {
    const data = await tryGeminiModel('gemini-pro', systemPrompt, 'v1');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) {
      let jsonText = text.trim();
      const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonText = jsonObjectMatch[0];
        const parsed = JSON.parse(jsonText);
        return {
          queryType: parsed.queryType || 'general',
          student_name: parsed.student_name,
          department: parsed.department,
          date: parsed.date || currentDate,
          status: parsed.status,
          confidence: parsed.confidence || 0.5,
        };
      }
    }
  } catch (error) {
    // Ignore
  }

  throw lastError || new Error('Failed to parse query intent');
}

// New function for analytics queries
export async function callGeminiAnalytics(
  query: string,
  data: {
    attendance?: { current: number; historical: number[] };
    finance?: { current: number; historical: number[] };
    students?: { current: number; historical: number[] };
  }
): Promise<string> {
  const systemPrompt = `You are an AI analytics assistant for a school ERP system. Analyze the provided data and provide insights, predictions, and recommendations.

Current Data:
${data.attendance ? `Attendance: Current ${data.attendance.current}%, Historical: ${data.attendance.historical.join(', ')}` : ''}
${data.finance ? `Finance: Current $${data.finance.current.toLocaleString()}, Historical: $${data.finance.historical.map(v => v.toLocaleString()).join(', $')}` : ''}
${data.students ? `Students: Current ${data.students.current}, Historical: ${data.students.historical.join(', ')}` : ''}

Query: ${query}

Provide a concise, actionable response with:
1. Key insights from the data
2. Trends and patterns
3. Predictions for the next period
4. Recommendations

Keep the response under 200 words and be specific with numbers.`;

  let lastError: Error | null = null;
  
  for (const model of MODEL_OPTIONS) {
    try {
      const response = await tryGeminiModel(model, systemPrompt, 'v1beta');
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (text) {
        return text.trim();
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message.includes('not found') || lastError.message.includes('not supported')) {
        continue;
      }
      break;
    }
  }

  // Fallback to v1
  try {
    const response = await tryGeminiModel('gemini-pro', systemPrompt, 'v1');
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) {
      return text.trim();
    }
  } catch (error) {
    // Ignore
  }

  throw lastError || new Error('Failed to generate analytics');
}

function parseAIResponse(text: string, context: AIContext): AIAction {
  try {

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```')) {
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Try to extract JSON object from text
        const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }
    } else {
      // Extract JSON object if it's embedded in text
      const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonText = jsonObjectMatch[0];
      }
    }

    let parsed: Partial<AIAction>;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', jsonText);
      throw new Error('Invalid JSON response from AI');
    }

    // Find student by name and department if provided
    if (parsed.student_name) {
      let matchingStudents = context.students.filter(
        s => s.name.toLowerCase().includes(parsed.student_name!.toLowerCase())
      );

      if (parsed.department) {
        matchingStudents = matchingStudents.filter(
          s => s.department?.toLowerCase().includes(parsed.department!.toLowerCase())
        );
      }

      if (matchingStudents.length === 1) {
        parsed.student_id = matchingStudents[0].id;
        parsed.student_name = matchingStudents[0].name;
        if (!parsed.department) {
          parsed.department = matchingStudents[0].department || undefined;
        }
      } else if (matchingStudents.length > 1) {
        // Multiple matches - use first one but lower confidence
        parsed.student_id = matchingStudents[0].id;
        parsed.student_name = matchingStudents[0].name;
        parsed.confidence = (parsed.confidence || 0.8) * 0.7;
        parsed.message = `${parsed.message || ''} (Multiple students found, using first match)`;
      }
    }

    // Set default date if not provided
    if (!parsed.date && parsed.action === 'mark_attendance') {
      parsed.date = context.currentDate;
    }

    return {
      action: parsed.action || 'unknown',
      student_name: parsed.student_name,
      department: parsed.department,
      status: parsed.status,
      student_id: parsed.student_id,
      date: parsed.date || context.currentDate,
      confidence: parsed.confidence || 0.5,
      message: parsed.message || 'Action parsed',
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse command';
    return {
      action: 'unknown',
      confidence: 0,
      message: errorMessage,
    };
  }
}
