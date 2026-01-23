import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Sparkles, TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { searchFeatures, getPopularSearches, SearchSuggestion } from "@/services/ai-search";

interface AISearchBarProps {
  onNavigate: (path: string, action?: string, actionData?: any) => void;
  className?: string;
}

export function AISearchBar({ onNavigate, className }: AISearchBarProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions(getPopularSearches(t));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchFeatures(searchQuery, undefined, t);
        setSuggestions(results);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length === 0) {
      setSuggestions(getPopularSearches(t));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      setSuggestions(getPopularSearches(t));
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery("");
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Navigate to the path
    onNavigate(suggestion.path, suggestion.action, suggestion.actionData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          handleSuggestionClick(suggestions[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-primary/20 text-primary font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Dashboard: "text-blue-500",
      "User Management": "text-purple-500",
      Students: "text-green-500",
      Attendance: "text-orange-500",
      Student: "text-teal-500",
      Finance: "text-emerald-500",
      Academics: "text-indigo-500",
      Reports: "text-pink-500",
      Facilities: "text-amber-500",
      Hostel: "text-cyan-500",
      Library: "text-violet-500",
      Examinations: "text-rose-500",
      Tools: "text-slate-500",
      Settings: "text-gray-500",
      System: "text-red-500",
    };
    return colors[category] || "text-muted-foreground";
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Sparkles className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary animate-pulse" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t("search.searchWithAI")}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="w-48 md:w-64 pl-9 pr-10 h-9 rounded-full bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all"
          aria-label={t("search.searchWithAI")}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={isOpen}
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          id="search-suggestions"
          className="absolute top-full mt-2 w-80 md:w-96 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-depth-2 overflow-hidden z-50 glass-modern"
          role="listbox"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t("search.searching")}
                  </>
                ) : query.trim() ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    {t("search.aiSuggestions")}
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    {t("search.popularSearches")}
                  </>
                )}
              </p>
              {suggestions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {suggestions.length}{" "}
                  {suggestions.length !== 1 ? t("search.results") : t("search.result")}
                </span>
              )}
            </div>
          </div>

          {/* Suggestions List */}
          <div className="max-h-96 overflow-y-auto">
            {suggestions.length === 0 && !isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("search.noResultsFound")}
              </div>
            ) : (
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.path}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none group",
                      selectedIndex === index && "bg-muted/50"
                    )}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {highlightMatch(suggestion.title, query)}
                          </p>
                          {suggestion.confidence > 0.8 && (
                            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                              {t("search.bestMatch")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wide",
                              getCategoryColor(suggestion.category)
                            )}
                          >
                            {suggestion.category}
                          </span>
                          {suggestion.action && (
                            <span className="text-[10px] text-muted-foreground">
                              •{" "}
                              {suggestion.action === "dialog"
                                ? t("search.opensDialog")
                                : suggestion.action === "focus"
                                  ? t("search.focusesSection")
                                  : t("search.navigates")}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Hint */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
              <p className="text-[10px] text-muted-foreground text-center">
                {t("search.useArrowKeysToNavigate")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
