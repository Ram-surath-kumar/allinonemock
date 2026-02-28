import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Sparkles, TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { searchFeatures, getPopularSearches, SearchSuggestion } from "@/services/ai-search";

interface AISearchBarProps {
  onNavigate: (path: string, action?: string, actionData?: any) => void;
  className?: string;
}

export function AISearchBar({ onNavigate, className }: AISearchBarProps) {
  const { t } = useI18n();
  const { currentUser } = useAuth();
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
        const results = await searchFeatures(searchQuery, currentUser, t);
        setSuggestions(results);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [t, currentUser]
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
  }, [query, performSearch, t]);

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
        <mark key={index} className="bg-primary/20 text-primary font-medium rounded-sm">
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
    <div ref={searchRef} className={cn("relative w-full transition-all duration-300", className)}>
      <div className="relative group/input">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-200" />
        <Sparkles className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/60 group-focus-within/input:text-primary animate-pulse" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t("search.searchWithAI")}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 h-10 rounded-2xl bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all duration-200 shadow-sm"
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
          className="fixed left-4 right-4 md:absolute md:left-0 md:right-0 md:w-[400px] top-full mt-3 bg-card border border-border/10 rounded-2xl shadow-2xl overflow-hidden z-[100] glass-modern animate-in slide-in-from-top-2 duration-300"
          role="listbox"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/5 bg-muted/20">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    {t("search.searching")}
                  </>
                ) : query.trim() ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {t("search.aiSuggestions")}
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    {t("search.popularSearches")}
                  </>
                )}
              </p>
              {suggestions.length > 0 && (
                <span className="text-[10px] font-bold text-primary/40">
                  {suggestions.length} {suggestions.length !== 1 ? "RESULTS" : "RESULT"}
                </span>
              )}
            </div>
          </div>

          {/* Suggestions List */}
          <div className="max-h-[min(70vh,400px)] overflow-y-auto overscroll-contain px-2 py-2">
            {suggestions.length === 0 && !isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground italic">
                {t("search.noResultsFound")}
              </div>
            ) : (
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.path}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-all duration-200 rounded-xl flex items-center gap-3 active:scale-[0.98]",
                      selectedIndex === index ? "bg-primary/10" : "hover:bg-muted/60"
                    )}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-foreground truncate uppercase tracking-tight">
                          {highlightMatch(suggestion.title, query)}
                        </p>
                        {suggestion.confidence > 0.8 && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded uppercase">
                            TOP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 font-medium opacity-80">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted/80",
                            getCategoryColor(suggestion.category)
                          )}
                        >
                          {suggestion.category}
                        </span>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Hint */}
          {suggestions.length > 0 && !isLoading && (
            <div className="px-5 py-3 border-t border-border/5 bg-muted/10">
              <p className="text-[9px] font-bold text-muted-foreground text-center uppercase tracking-widest opacity-60">
                {t("search.useArrowKeysToNavigate")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
