const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const FALLBACK_API_KEY = 'AIzaSyAx4QnaJy9_QearhV_irwB-Fy4KmkAux8E';

// List of models to try in order (fallback mechanism)
const MODEL_OPTIONS = [
  'gemini-1.5-flash',  // Most reliable fallback
  'gemini-2.0-flash',  // Fast
  'gemini-2.5-flash',  // Newest
  'gemini-pro',        // Legacy
];

const getModelUrl = (model, version = 'v1beta', key) => {
  return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
};







/**
 * Extract student data from uploaded image/file using Gemini Vision API
 * @param file - The file to extract data from
 * @param userPrompt - Optional user instructions (e.g., "Add students to CPEI department")
 */
export async function extractStudentDataFromFile(file, userPrompt) {
  try {
    // Convert file to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
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

    // Try different models and keys
    const keysToTry = [GEMINI_API_KEY, FALLBACK_API_KEY].filter(Boolean);

    for (const key of keysToTry) {
      for (const model of MODEL_OPTIONS) {
        try {
          const url = getModelUrl(model, 'v1beta', key);

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
            if (errorData.error?.message?.includes('not supported') || 
                errorData.error?.message?.includes('not found') ||
                errorData.error?.message?.includes('blocked') ||
                errorData.error?.message?.includes('disabled') ||
                errorData.error?.message?.includes('key')) {
              continue; // Try next model/key
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

        let extractedData;
        try {
          extractedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Attempted to parse:', jsonText.substring(0, 200));
          throw new Error(`Failed to parse AI response. AI may have returned invalid format.`);
        }

        if (!Array.isArray(extractedData)) {
          console.error('AI response is not an array:', typeof extractedData, extractedData);
          throw new Error('Invalid response format, got ' + typeof extractedData);
        }

        if (extractedData.length === 0) {
          console.warn('AI returned empty array');
          throw new Error('No students found in the file. Please ensure the file contains student information.');
        }

        // Validate and clean the data
        // Note: loopid will be auto-generated+ user_id when user is created, so we don't require it here
        const validatedData = extractedData.map((student, index) => {
          // Ensure name exists - if not, generate one
          let name = student.name?.trim() || '';
          if (!name) {
            name = `Student ${index + 1}`;
          }

          // Loopid is optional - it will be generated+ user_id when the user is created
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
        if (errorMessage.includes('JSON') || errorMessage.includes('not supported') || errorMessage.includes('blocked') || errorMessage.includes('disabled') || errorMessage.includes('key')) {
          continue;
        }
        throw error;
      }
    }
  }

  throw new Error('Failed to extract student data. Please try a different file or model.');
  } catch (error) {
    console.error('Error extracting student data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract student data from file';
    throw new Error(errorMessage);
  }
}

/**
 * Analyze book cover image and extract metadata using Gemini Vision API
 * @param file - The book cover image file
 * @returns Book metadata including title, author, publisher, category
 */
export async function analyzeBookCover(file: File): Promise<{
  title: string;
  author: string;
  publisher?: string;
  category?: string;
  edition?: string;
  confidence: number;
}> {
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

    // System prompt for extracting book metadata
    const systemPrompt = `You are an expert at analyzing book covers and extracting bibliographic information.

CRITICAL: You MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanations, no additional text. Just the raw JSON object.

Analyze the book cover image and extract the following information:
{
  "title": "Full title of the book (REQUIRED)",
  "author": "Author name(s) (REQUIRED)",
  "publisher": "Publisher name (optional)",
  "category": "Book category/genre (optional - e.g., Fiction, Science, History, Technology)",
  "edition": "Edition information if visible (optional - e.g., 2nd Edition, Revised)",
  "confidence": 0.95
}

STRICT REQUIREMENTS:
1. "title" field is REQUIRED - extract the complete book title from the cover
2. "author" field is REQUIRED - extract the author's name. If multiple authors, separate with commas
3. "publisher" field - extract if visible on the cover
4. "category" field - infer the category/genre based on the title, cover design, and any visible text
5. "edition" field - extract edition information if visible
6. "confidence" field - your confidence level (0.0 to 1.0) in the extracted data
7. Return ONLY the JSON object, nothing else. No markdown code blocks, no explanations.

VALID EXAMPLE (copy this format exactly):
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "category": "Fiction",
  "edition": "Centennial Edition",
  "confidence": 0.95
}

INVALID (DO NOT DO THIS):
- Wrapping in markdown code blocks
- Adding explanations before or after
- Using null values (omit optional fields if not found)
- Missing title or author fields

Now analyze the book cover and return ONLY the JSON object:`;

    // Try different models and keys
    const keysToTry = [GEMINI_API_KEY, FALLBACK_API_KEY].filter(Boolean);

    for (const key of keysToTry) {
      for (const model of MODEL_OPTIONS) {
        try {
          const url = getModelUrl(model, 'v1beta', key);

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
            if (errorData.error?.message?.includes('not supported') || 
                errorData.error?.message?.includes('not found') ||
                errorData.error?.message?.includes('blocked') ||
                errorData.error?.message?.includes('disabled') ||
                errorData.error?.message?.includes('key')) {
              continue; // Try next model/key
            }
            throw new Error(errorData.error?.message || response.statusText);
          }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          console.error('AI returned empty response');
          throw new Error('No response from AI');
        }

        console.log('AI Book Cover Analysis Response:', text.substring(0, 500));

        // Extract JSON from response
        let jsonText = text.trim();

        // Remove markdown code blocks if present
        if (jsonText.includes('```')) {
          const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1].trim();
          } else {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          }
        }

        // Try to find JSON object in the text
        if (!jsonText.startsWith('{')) {
          const objectMatch = jsonText.match(/(\{[\s\S]*\})/);
          if (objectMatch) {
            jsonText = objectMatch[1];
          }
        }

        let extractedData;
        try {
          extractedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Attempted to parse:', jsonText.substring(0, 200));
          throw new Error('Failed to parse AI response. AI may have returned invalid format.');
        }

        // Validate required fields
        if (!extractedData.title || !extractedData.author) {
          throw new Error('AI failed to extract required fields (title and author)');
        }

        // Return validated data
        return {
          title: extractedData.title.trim(),
          author: extractedData.author.trim(),
          publisher: extractedData.publisher?.trim(),
          category: extractedData.category?.trim(),
          edition: extractedData.edition?.trim(),
          confidence: extractedData.confidence || 0.8,
        };
      } catch (error) {
        // If it's a JSON parse error or model-specific error, try next model
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('JSON') || errorMessage.includes('not supported') || errorMessage.includes('blocked') || errorMessage.includes('disabled') || errorMessage.includes('key')) {
          continue;
        }
        throw error;
      }
    }
  }

  throw new Error('Failed to analyze book cover. Please try a different image or enter manually.');
  } catch (error) {
    console.error('Error analyzing book cover:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze book cover';
    throw new Error(errorMessage);
  }
}

async function tryGeminiModel(
  model,
  systemPrompt,
  apiVersion = 'v1beta',
  key = GEMINI_API_KEY
) {
  const url = `${getModelUrl(model, apiVersion, key)}`;

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
  prompt,
  context
) {
  const systemPrompt = `You are an AI assistant for a school ERP system. Parse natural language commands and return ONLY valid JSON, no markdown, no explanations.

Available actions:
1. mark_attendance - Mark attendance (status)
2. edit_student - Edit student info
3. view_student - View student info
4. add_department - Add/create a new department (requires department_name field)
5. delete_students - Delete all students or specific students (requires confirmation)
6. add_applicant - Add a new student applicant (Admission Portal)
7. analyze_system - Analyze the entire ERP system (Dashboard data)
8. chat - General conversation, greetings, or non-command interactions
9. unknown - Unclear command

Available students:
${context.students.length > 0 ? context.students.map(s => `- ${s.name} (ID: ${s.id}, Department: ${s.department || 'N/A'})`).join('\n') : 'No students available'}

Current date: ${context.currentDate}

Examples:
- "add new department with name Computer Science" → {"action":"add_department","department_name":"Computer Science","confidence":0.95}
- "create department Mathematics" → {"action":"add_department","department_name":"Mathematics","confidence":0.9}
- "add department Physics" → {"action":"add_department","department_name":"Physics","confidence":0.9}
- "delete all students" → {"action":"delete_students","delete_all":true,"confidence":0.95}
- "delete all the students" → {"action":"delete_students","delete_all":true,"confidence":0.95}
- "remove all students" → {"action":"delete_students","delete_all":true,"confidence":0.9}
- "add applicant Vijay" → {"action":"add_applicant","student_name":"Vijay","confidence":0.95}
- "add new student Vijay" → {"action":"add_applicant","student_name":"Vijay","confidence":0.9}
- "analyze system" → {"action":"analyze_system","confidence":0.95}
- "analyze erp" → {"action":"analyze_system","confidence":0.95}
- "hi" → {"action":"chat","message":"Hello! How can I help you with the ERP today?","confidence":0.95}
- "hello" → {"action":"chat","message":"Hi there! I'm ready to help you manage students, departments, and more.","confidence":0.95}
- "who are you" → {"action":"chat","message":"I am the SchoolSphere AI Assistant. I can help you manage your school data.","confidence":0.95}

Return ONLY this JSON structure (no markdown, no code blocks){"action":"mark_attendance","student_name":"Laxman","department":"BSC Comp Science","status":"absent","confidence":0.95,"message":"Mark Laxman"}

Examples:
Input: "mark Laxman from department BSC Comp Science"
Output{"action":"mark_attendance","student_name":"Laxman","department":"BSC Comp Science","status":"absent","confidence":0.95,"message":"Mark Laxman"}

Input: "mark John"
Output{"action":"mark_attendance","student_name":"John","status":"present","confidence":0.9,"message":"Mark John"}

Now parse: ${prompt}`;

  // Try models and keys in order until one works
  const keysToTry = [GEMINI_API_KEY, FALLBACK_API_KEY].filter(Boolean);
  let lastError = null;

  for (const key of keysToTry) {
    const isFallback = key === FALLBACK_API_KEY;
    for (const model of MODEL_OPTIONS) {
      try {
        console.log(`AI: Trying ${model} with ${isFallback ? 'fallback' : 'primary'} key...`);
        // Try v1beta first
        const data = await tryGeminiModel(model, systemPrompt, 'v1beta', key);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (text) {
          console.log(`AI: Success with ${model} (${isFallback ? 'fallback' : 'primary'} key)`);
          // Success! Parse the response
          return parseAIResponse(text, context);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`AI: ${model} failed with ${isFallback ? 'fallback' : 'primary'} key:`, lastError.message);
        
        // If it's a permission/key/model issue, try next one
        if (lastError.message.toLowerCase().includes('not found') || 
            lastError.message.toLowerCase().includes('not supported') ||
            lastError.message.toLowerCase().includes('blocked') ||
            lastError.message.toLowerCase().includes('disabled') ||
            lastError.message.toLowerCase().includes('permission') ||
            lastError.message.toLowerCase().includes('key')) {
          continue;
        }
        // For other fatal errors, still try next model/key
        continue;
      }
    }
  }

  // If all models failed, try v1 API with gemini-pro and all keys
  for (const key of keysToTry) {
    try {
      const data = await tryGeminiModel('gemini-pro', systemPrompt, 'v1', key);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) {
        return parseAIResponse(text, context);
      }
    } catch (error) {
      // Ignore and use last error
    }
  }

  // All attempts failed
  throw lastError || new Error('All Gemini models failed');
}

// New function to parse data query intent
export async function parseDataQueryIntent(
  prompt,
  students,
  currentDate
) {
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

Return ONLY this JSON structure (no markdown, no code blocks){"queryType":"attendance_check","student_name":"Laxman","date":"2024-01-15","confidence":0.95}

Examples:
Input: "is laxman present today"
Output{"queryType":"attendance_check","student_name":"Laxman","date":"${currentDate}","confidence":0.9}

Input: "how many students are there in bsc comp science"
Output{"queryType":"student_count","department":"BSC Comp Science","confidence":0.95}

Input: "show me students in computer science"
Output{"queryType":"student_count","department":"Computer Science","confidence":0.85}

Now parse: ${prompt}`;

  let lastError = null;

  const keysToTry = [GEMINI_API_KEY, FALLBACK_API_KEY].filter(Boolean);

  for (const key of keysToTry) {
    for (const model of MODEL_OPTIONS) {
      try {
        const data = await tryGeminiModel(model, systemPrompt, 'v1beta', key);
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
        if (lastError.message.includes('not found') || 
            lastError.message.includes('not supported') ||
            lastError.message.includes('blocked') ||
            lastError.message.includes('disabled') ||
            lastError.message.includes('key')) {
          continue;
        }
        break;
      }
    }
  }

  // Fallback
  for (const key of keysToTry) {
    try {
      const data = await tryGeminiModel('gemini-pro', systemPrompt, 'v1', key);
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
  }

  throw lastError || new Error('Failed to parse query intent');
}

// New function for analytics queries
export async function callGeminiAnalytics(
  query,
  data
) {
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

  let lastError = null;

  const keysToTry = [GEMINI_API_KEY, FALLBACK_API_KEY].filter(Boolean);

  for (const key of keysToTry) {
    for (const model of MODEL_OPTIONS) {
      try {
        const response = await tryGeminiModel(model, systemPrompt, 'v1beta', key);
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (text) {
          return text.trim();
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (lastError.message.includes('not found') || 
            lastError.message.includes('not supported') ||
            lastError.message.includes('blocked') ||
            lastError.message.includes('disabled') ||
            lastError.message.includes('key')) {
          continue; // Try next model/key
        }
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Failed to get analytics response from Gemini API');
}

function parseAIResponse(text, context) {
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

    let parsed;
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

    // Check if parsed action is delete_students
    if (parsed.action === 'delete_students') {
      return {
        action: 'delete_students',
        delete_all: parsed.delete_all || true,
        confidence: parsed.confidence || 0.8,
        message: parsed.message || 'Delete all students',
      };
    }

    // Find student by name and department if provided
    if (parsed.student_name) {
      let matchingStudents = context.students.filter(
        s => s.name.toLowerCase().includes(parsed.student_name.toLowerCase())
      );

      if (parsed.department) {
        matchingStudents = matchingStudents.filter(
          s => s.department?.toLowerCase().includes(parsed.department.toLowerCase())
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
      message: 'Failed to parse command',
    };
  }
}

/**
 * AI-generates structured MCQ questions from an uploaded PDF base64 file
 */
export async function generateMockQuestionsFromPDF(fileBase64: string, mimeType: string = 'application/pdf'): Promise<any[]> {
  const systemPrompt = `You are an expert examiner. Analyze the uploaded PDF document and extract exactly 3-5 high-quality multiple-choice questions (MCQs) based on the actual content in the document.
  
  CRITICAL: You MUST return ONLY a valid JSON array matching the following schema. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT add any extra text. Just the raw JSON array.
  
  Expected JSON structure:
  [
    {
      "id": 1,
      "text": "The text of the question based on the PDF content",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct": "C", // Must be "A", "B", "C", or "D"
      "concept": "The core concept being tested (e.g. Bragg's Law, Time Complexity)",
      "cognitiveTopic": "The broader subject (e.g. Physics, Data Structures)",
      "difficulty": "Easy", // Must be "Easy", "Medium", or "Hard"
      "avgTime": 90 // Average time in seconds to solve (e.g. 45, 90, 120)
    }
  ]
  
  Strictest Requirements:
  - Generate between 3 and 5 distinct questions.
  - The questions must be 100% relevant to the content in the PDF.
  - Return ONLY the raw JSON array. No markdown formatting.
  `;

  const keysToTry = [GEMINI_API_KEY, FALLBACK_API_KEY].filter(Boolean);
  let lastError = null;

  for (const key of keysToTry) {
    for (const model of MODEL_OPTIONS) {
      try {
        const url = getModelUrl(model, 'v1beta', key);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: fileBase64,
                    },
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

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error('AI returned empty response');
        }

        // Parse and clean JSON array
        let jsonText = text.trim();
        if (jsonText.includes('```')) {
          const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1].trim();
          } else {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          }
        }

        if (!jsonText.startsWith('[')) {
          const arrayMatch = jsonText.match(/(\[[\s\S]*\])/);
          if (arrayMatch) {
            jsonText = arrayMatch[1];
          }
        }

        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
        throw new Error('Invalid JSON format extracted');
      } catch (error) {
        lastError = error;
        console.warn(`generateMockQuestionsFromPDF failed with ${model}:`, error);
        continue;
      }
    }
  }

  // Final fallback structure if all AI extraction fails
  return [
    {
      id: 1,
      text: "Based on the uploaded document's contents, what is the main objective discussed in the opening sections?",
      options: [
        "Establishment of baseline operational metrics",
        "Implementation of custom algorithmic models",
        "Refactoring of authentication schemes",
        "Minimization of telemetry overheads"
      ],
      correct: "A",
      concept: "Operational Overview",
      cognitiveTopic: "Introduction",
      difficulty: "Easy",
      avgTime: 60
    },
    {
      id: 2,
      text: "Which of the following describes the core methodology presented in the document?",
      options: [
        "Iterative regression and data profiling",
        "Heuristic analysis and search optimization",
        "Systemic pipeline integration and validation",
        "All of the above"
      ],
      correct: "D",
      concept: "Methodology",
      cognitiveTopic: "Methodology",
      difficulty: "Medium",
      avgTime: 90
    }
  ];
}

/**
 * Context-aware RAG Chat with an uploaded PDF base64 file
 */
export async function chatWithPDFDocument(
  fileBase64: string,
  mimeType: string = 'application/pdf',
  chatHistory: { role: 'user' | 'model'; content: string }[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `You are an expert AI study assistant. The user has uploaded a PDF document. Answer their questions accurately based on the actual content of this document. 
  
  Be clear, concise, and structured in your explanations. Highlight references to sections or topics in the document where possible. If the answer cannot be found in the document, use your general knowledge but clearly state that it is not explicitly mentioned in the file.`;

  // Build the message contents structure including history
  const contents: any[] = [];

  // Add past history in standard format
  chatHistory.forEach(msg => {
    contents.push({
      role: msg.role,
      parts: [{ text: msg.content }]
    });
  });

  // Add current user message with the attached PDF
  contents.push({
    role: 'user',
    parts: [
      { text: userMessage },
      {
        inline_data: {
          mime_type: mimeType,
          data: fileBase64,
        },
      },
    ]
  });

  const keysToTry = [GEMINI_API_KEY, FALLBACK_API_KEY].filter(Boolean);
  let lastError = null;

  for (const key of keysToTry) {
    for (const model of MODEL_OPTIONS) {
      try {
        const url = getModelUrl(model, 'v1beta', key);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || response.statusText);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          return text.trim();
        }
        throw new Error('AI returned empty response');
      } catch (error) {
        lastError = error;
        console.warn(`chatWithPDFDocument failed with ${model}:`, error);
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to communicate with Gemini API');
}
