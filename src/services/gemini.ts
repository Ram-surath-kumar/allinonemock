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
  action: 'mark_attendance' | 'edit_student' | 'view_student' | 'add_department' | 'unknown';
  student_name?: string;
  department?: string;
  department_name?: string;
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

export interface ExtractedStudentData {
  name: string;
  loopid: string;
  department?: string;
  department_id?: string;
  year?: string;
  semester?: string;
  phone?: string;
  address?: string;
}

/**
 * Extract student data from uploaded image/file using Gemini Vision API
 * @param file - The file to extract data from
 * @param userPrompt - Optional user instructions (e.g., "Add students to CPEI department")
 */
export async function extractStudentDataFromFile(file: File, userPrompt?: string): Promise<ExtractedStudentData[]> {
  try {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Determine MIME type
    const mimeType = file.type || 'image/jpeg';

    // System prompt for extracting student data
    const systemPrompt = `You are an expert at extracting student information from documents, forms, images, or any file format.

${userPrompt ? `USER INSTRUCTIONS: ${userPrompt}\n\nPlease follow these instructions when extracting data. If the user mentions a specific department, assign all students to that department in the "department" field.` : ''}

CRITICAL: You MUST return ONLY a valid JSON array. No markdown, no code blocks, no explanations, no additional text. Just the raw JSON array.

Extract ALL student information from the provided file/image. Return a JSON array of student objects with this EXACT structure:

[
  {
    "name": "Full name of the student",
    "loopid": "Loop ID or Student ID (REQUIRED - extract any ID number you find)",
    "department": "Department name (optional)",
    "year": "Year of study (optional)",
    "semester": "Semester (optional)",
    "phone": "Phone number (optional)",
    "address": "Address (optional)"
  }
]

STRICT REQUIREMENTS:
1. "name" field is REQUIRED - extract the student's full name. If name is not visible, use "Student" + a number.
2. "loopid" field is REQUIRED - extract ANY student ID, registration number, roll number, or unique identifier you find. If no ID is visible, generate a unique ID like "STU001", "STU002", etc.
3. "department" field - extract department name if visible. ${userPrompt && userPrompt.toLowerCase().includes('department') ? `If user mentioned a department in instructions, use that department name for all students.` : ''}
4. Return an array even if there's only one student.
5. Do NOT include null values or empty strings - omit optional fields entirely if not found.
6. Return ONLY the JSON array, nothing else. No markdown code blocks, no explanations.

VALID EXAMPLE (copy this format exactly):
[
  {
    "name": "John Doe",
    "loopid": "10334343",
    "department": "Computer Science"
  },
  {
    "name": "Jane Smith",
    "loopid": "10334444"
  }
]

INVALID (DO NOT DO THIS):
- Wrapping in markdown code blocks
- Adding explanations before or after
- Using null or empty strings
- Missing name or loopid fields

Now extract the student data and return ONLY the JSON array:`;

    // Try different models
    for (const model of MODEL_OPTIONS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
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
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.message?.includes('not supported') || errorData.error?.message?.includes('not found')) {
            continue; // Try next model
          }
          throw new Error(errorData.error?.message || response.statusText);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          console.error('AI returned empty response');
          throw new Error('No response from AI');
        }

        console.log('AI Raw Response:', text.substring(0, 500)); // Log first 500 chars for debugging

        // Extract JSON from response (handle various formats)
        let jsonText = text.trim();
        
        // Remove markdown code blocks if present
        if (jsonText.includes('```')) {
          // Try to extract JSON from code blocks
          const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1].trim();
          } else {
            // Remove code block markers
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          }
        }
        
        // Try to find JSON array in the text
        if (!jsonText.startsWith('[')) {
          const arrayMatch = jsonText.match(/(\[[\s\S]*\])/);
          if (arrayMatch) {
            jsonText = arrayMatch[1];
          }
        }
        
        // Remove any leading/trailing text that's not JSON
        jsonText = jsonText.trim();
        if (!jsonText.startsWith('[')) {
          // Try to find where the array starts
          const startIndex = jsonText.indexOf('[');
          if (startIndex !== -1) {
            jsonText = jsonText.substring(startIndex);
          }
        }
        if (!jsonText.endsWith(']')) {
          // Try to find where the array ends
          const endIndex = jsonText.lastIndexOf(']');
          if (endIndex !== -1) {
            jsonText = jsonText.substring(0, endIndex + 1);
          }
        }

        let extractedData: ExtractedStudentData[];
        try {
          extractedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Attempted to parse:', jsonText.substring(0, 200));
          throw new Error(`Failed to parse AI response as JSON. AI may have returned invalid format.`);
        }

        if (!Array.isArray(extractedData)) {
          console.error('AI response is not an array:', typeof extractedData, extractedData);
          throw new Error('Invalid response format: expected array, got ' + typeof extractedData);
        }

        if (extractedData.length === 0) {
          console.warn('AI returned empty array');
          throw new Error('No students found in the file. Please ensure the file contains student information.');
        }

        // Validate and clean the data
        // Note: loopid will be auto-generated as org_id + user_id when user is created, so we don't require it here
        const validatedData = extractedData.map((student, index) => {
          // Ensure name exists - if not, generate one
          let name = student.name?.trim() || '';
          if (!name) {
            name = `Student ${index + 1}`;
          }
          
          // Loopid is optional - it will be generated as org_id + user_id when the user is created
          // We can still extract it if present in the document, but it's not required
          let loopid = student.loopid?.trim() || '';
          if (loopid) {
            // Clean loopid - remove "g:" prefix if present
            loopid = loopid.replace(/^g:/i, '').trim();
          }
          
          return {
            name,
            loopid, // Optional - will be auto-generated if not provided
            department: student.department?.trim(),
            department_id: student.department_id,
            year: student.year?.trim(),
            semester: student.semester?.trim(),
            phone: student.phone?.trim(),
            address: student.address?.trim(),
          };
        });

        // Filter out entries that are completely invalid (only need name, loopid is optional)
        const finalData = validatedData.filter(student => student.name);

        if (finalData.length === 0) {
          console.error('All students filtered out. Original data:', extractedData);
          throw new Error('No valid student data extracted. Please check the file contains student information with names and IDs.');
        }

        console.log(`Successfully extracted ${finalData.length} student(s)`);
        return finalData;
      } catch (error) {
        // If it's a JSON parse error or model-specific error, try next model
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('JSON') || errorMessage.includes('not supported')) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to extract student data. Please try a different file or model.');
  } catch (error) {
    console.error('Error extracting student data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract student data from file';
    throw new Error(errorMessage);
  }
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

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

async function tryGeminiModel(
  model: string,
  systemPrompt: string,
  apiVersion: string = 'v1beta'
): Promise<GeminiResponse> {
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
4. add_department - Add/create a new department (requires department_name field)
5. unknown - Unclear command

Available students:
${context.students.length > 0 ? context.students.map(s => `- ${s.name} (ID: ${s.id}, Department: ${s.department || 'N/A'})`).join('\n') : 'No students available'}

Current date: ${context.currentDate}

Examples:
- "add new department with name Computer Science" → {"action":"add_department","department_name":"Computer Science","confidence":0.95}
- "create department Mathematics" → {"action":"add_department","department_name":"Mathematics","confidence":0.9}
- "add department Physics" → {"action":"add_department","department_name":"Physics","confidence":0.9}

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
    // Check for department creation commands first
    const departmentMatch = text.match(/add\s+(?:new\s+)?department\s+(?:with\s+name\s+)?["']?([^"']+)["']?/i);
    if (departmentMatch) {
      return {
        action: 'add_department',
        department_name: departmentMatch[1].trim(),
        confidence: 0.9,
        message: `Creating department: ${departmentMatch[1].trim()}`,
      };
    }

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

    // Check if parsed action is add_department
    if (parsed.action === 'add_department' && parsed.department_name) {
      return {
        action: 'add_department',
        department_name: parsed.department_name,
        confidence: parsed.confidence || 0.8,
        message: parsed.message || `Creating department: ${parsed.department_name}`,
      };
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
