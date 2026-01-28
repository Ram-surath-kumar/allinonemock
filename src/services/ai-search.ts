import { callGeminiAPI } from "./gemini";
import { getActionsForUser, AppAction } from "./action-registry";

export interface SearchSuggestion {
  title: string;
  description: string;
  path: string;
  category: string;
  icon?: string;
  confidence: number;
  action?: "navigate" | "dialog" | "focus" | "function";
  actionData?: any;
}

/**
 * Search features using AI-powered natural language understanding
 * @param query - Search query string
 * @param currentUser - Current user object (optional)
 * @param t - Translation function (optional)
 */
export async function searchFeatures(
  query: string,
  currentUser?: any,
  t?: (key: string) => string
): Promise<SearchSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Get actions relevant to the user's role
  const availableActions = getActionsForUser(currentUser?.role);

  // Map actions to knowledge base items with translations if available
  const knowledgeBase = availableActions.map((action) => {
    const title = t ? t(action.id) || action.title : action.title;
    // Fallback logic for description translation could be added here
    const description = action.description;

    return {
      ...action,
      title,
      description
    };
  });

  // First, try direct keyword matching for instant results
  const keywordMatches = knowledgeBase.filter((feature) => {
    return feature.keywords.some(
      (keyword) => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)
    );
  }).map((feature) => ({
    title: feature.title,
    description: feature.description,
    path: feature.path || "/",
    category: feature.category,
    confidence: calculateConfidence(normalizedQuery, feature.keywords),
    action: feature.action,
    actionData: feature.actionData,
    icon: feature.icon
  }));

  // Sort by confidence and take top 5
  const topKeywordMatches = keywordMatches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  // If we have high-confidence keyword matches, return them immediately
  if (topKeywordMatches.length > 0 && topKeywordMatches[0].confidence > 0.7) {
    return topKeywordMatches;
  }

  // For more complex queries, use AI
  try {
    const aiContext = {
      // simplified context
      availableFeatures: knowledgeBase.map(a => a.title).join(", "),
      currentDate: new Date().toISOString().split("T")[0],
    };

    // Create a prompt for AI to understand the search intent
    const searchPrompt = `Parse this search query and identify what the user is looking for: "${query}"
    
Available features: ${knowledgeBase.map((f) => f.title).join(", ")}

Return ONLY a JSON object with this structure:
{
  "intent": "brief description of what user wants",
  "matchingFeatures": ["feature1", "feature2"], // Exact titles from the list
  "confidence": 0.95
}`;

    const aiResponse = await callGeminiAPI(searchPrompt, aiContext);

    // Combine AI results with keyword matches
    const combinedResults = [...topKeywordMatches];

    // Add unique AI suggestions
    if (aiResponse && aiResponse.action !== "unknown") {
      // Find features that partially match the AI's suggested "matchingFeatures" strings
      // or if the AI returned a message/intent that maps to a feature
      const suggestedTitles = aiResponse.matchingFeatures || [aiResponse.message];

      const aiSuggestions = knowledgeBase.filter((f) =>
        suggestedTitles.some((title: string) => f.title.toLowerCase().includes(title?.toLowerCase() || ""))
      ).map((f) => ({
        title: f.title,
        description: f.description,
        path: f.path || "/",
        category: f.category,
        confidence: aiResponse.confidence || 0.6,
        action: f.action,
        actionData: f.actionData,
        icon: f.icon
      }));

      aiSuggestions.forEach((suggestion) => {
        if (!combinedResults.some((r) => r.path === suggestion.path && r.title === suggestion.title)) {
          combinedResults.push(suggestion);
        }
      });
    }

    return combinedResults.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  } catch (error) {
    console.error("AI search error:", error);
    // Fallback to keyword matches
    return topKeywordMatches;
  }
}

/**
 * Calculate confidence score based on keyword matching
 */
function calculateConfidence(query: string, keywords: string[]): number {
  const queryWords = query.toLowerCase().split(" ");
  let score = 0;

  keywords.forEach((keyword) => {
    const keywordWords = keyword.toLowerCase().split(" ");

    // Exact match
    if (keyword === query) {
      score = Math.max(score, 1.0);
      return;
    }

    // Keyword contains query
    if (keyword.includes(query)) {
      score = Math.max(score, 0.9);
      return;
    }

    // Query contains keyword
    if (query.includes(keyword)) {
      score = Math.max(score, 0.85);
      return;
    }

    // Word-level matching
    const matchingWords = queryWords.filter((qw) =>
      keywordWords.some((kw) => kw.includes(qw) || qw.includes(kw))
    );

    if (matchingWords.length > 0) {
      const wordScore = matchingWords.length / Math.max(queryWords.length, keywordWords.length);
      score = Math.max(score, wordScore * 0.7);
    }
  });

  return Math.min(score, 1.0);
}

/**
 * Get popular/suggested searches
 * @param t - Optional translation function. If provided, will translate titles and descriptions
 */
export function getPopularSearches(t?: (key: string) => string): SearchSuggestion[] {
  // Return a curated list of top actions from the registry
  const curatedIds = ["attendance.mark", "users.add", "students.view", "finance.dashboard"];
  const actions = getActionsForUser().filter(a => curatedIds.includes(a.id));

  return actions.map(action => ({
    title: t ? t(action.id) || action.title : action.title,
    description: action.description,
    path: action.path || "/",
    category: action.category,
    confidence: 1.0,
    action: action.action,
    actionData: action.actionData,
    icon: action.icon
  }));
}
