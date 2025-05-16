import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FlashcardSuggestionDto } from "@/types";

interface AISuggestionsState {
  sourceText: string | null;
  suggestions: FlashcardSuggestionDto[];
  setSuggestions: (sourceText: string, suggestions: FlashcardSuggestionDto[]) => void;
  clearSuggestions: () => void;
}

export const useAISuggestionsStore = create<AISuggestionsState>()(
  persist(
    (set) => ({
      sourceText: null,
      suggestions: [],
      setSuggestions: (sourceText, suggestions) => set({ sourceText, suggestions }),
      clearSuggestions: () => set({ sourceText: null, suggestions: [] }),
    }),
    {
      name: "ai-suggestions-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
