import React, { useEffect, useState } from "react";
import { useAISuggestionsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // For future editing
import { FlashcardSourceEnum } from "@/types"; // Added import

interface AIReviewSuggestionsProps {
  onNavigate?: (path: string) => void; // Prop for navigation
}

export default function AIReviewSuggestions({ onNavigate }: AIReviewSuggestionsProps) {
  const { sourceText, suggestions, clearSuggestions } = useAISuggestionsStore();
  const [isSaving, setIsSaving] = useState(false); // Added state for loading

  useEffect(() => {
    // console.log("Tekst źródłowy ze store:", sourceText);
    // console.log("Sugestie ze store:", suggestions);
    // Optional: Clear suggestions after viewing them if they are not meant to persist
    // or if navigating away and back should not show old data without regeneration.
    // return () => {
    //   clearSuggestions();
    // };
  }, [sourceText, suggestions]);

  const handleSaveSuggestions = async () => {
    if (suggestions.length === 0) {
      alert("Brak sugestii do zapisania.");
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Create a new deck
      const deckResponse = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Fiszki wygenerowane przez AI" }),
      });

      if (!deckResponse.ok) {
        const errorData = await deckResponse.json().catch(() => ({}));
        throw new Error(
          `Nie udało się utworzyć talii fiszek: ${deckResponse.status} ${deckResponse.statusText}. ${errorData.message || ""}`
        );
      }

      const newDeck = await deckResponse.json();
      const deckId = newDeck.id;

      if (!deckId) {
        throw new Error("Nie udało się uzyskać ID nowej talii.");
      }

      // Step 2: Prepare and save flashcards
      const flashcardsToSave = suggestions.map((suggestion) => ({
        front: suggestion.front,
        back: suggestion.back,
        source: FlashcardSourceEnum.AI_FULL,
      }));

      const flashcardsResponse = await fetch(`/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcards: flashcardsToSave }),
      });

      if (!flashcardsResponse.ok) {
        const errorData = await flashcardsResponse.json().catch(() => ({}));
        throw new Error(
          `Nie udało się zapisać fiszek: ${flashcardsResponse.status} ${flashcardsResponse.statusText}. ${errorData.message || ""}`
        );
      }

      await flashcardsResponse.json(); // Assuming this returns the created flashcards or a success message

      alert("Fiszki zostały pomyślnie zapisane!");
      clearSuggestions();
      if (onNavigate) {
        onNavigate("/ai/generate");
      } else {
        window.location.href = "/ai/generate";
      }
    } catch (error) {
      console.error("Błąd podczas zapisywania fiszek:", error);
      alert(`Wystąpił błąd podczas zapisywania fiszek: ${error instanceof Error ? error.message : "Nieznany błąd"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Brak sugestii</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Nie znaleziono żadnych sugestii fiszek. Wygląda na to, że nic tu nie ma.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <a href="/ai/generate">Wygeneruj nowe sugestie</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Tekst źródłowy</CardTitle>
          <CardDescription>Poniżej znajduje się tekst, na podstawie którego wygenerowano sugestie.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-md bg-background text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
            {sourceText || "Brak tekstu źródłowego."}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-1">Przeglądaj sugestie ({suggestions.length})</h2>
        <p className="text-muted-foreground mb-4">
          Sprawdź poniższe sugestie. W przyszłości będzie można je tutaj edytować.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Sugestia #{index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label htmlFor={`front-${index}`} className="block text-sm font-medium text-muted-foreground mb-1">
                    Przód
                  </label>
                  <Textarea
                    id={`front-${index}`}
                    value={suggestion.front}
                    readOnly
                    rows={3}
                    className="bg-background"
                  />
                </div>
                <div>
                  <label htmlFor={`back-${index}`} className="block text-sm font-medium text-muted-foreground mb-1">
                    Tył
                  </label>
                  <Textarea id={`back-${index}`} value={suggestion.back} readOnly rows={3} className="bg-background" />
                </div>
              </CardContent>
              {/* <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm">Edytuj (TODO)</Button>
              </CardFooter> */}
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <Button
          variant="outline"
          onClick={() => {
            if (onNavigate) {
              onNavigate("/ai/generate");
            } else {
              console.warn("Navigate function not provided, falling back to window.location.href");
              window.location.href = "/ai/generate";
            }
          }}
        >
          Anuluj i wygeneruj nowe
        </Button>
        <Button onClick={handleSaveSuggestions} disabled={isSaving}>
          {isSaving ? "Zapisywanie..." : "Zapisz sugestie"}
        </Button>
      </div>
    </div>
  );
}
