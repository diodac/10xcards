import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { GenerateFlashcardsCommand, GenerateFlashcardsResponseDto } from "@/types";
import { useAISuggestionsStore } from "@/lib/store";

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

interface AIGenerationFormProps {
  onNavigate?: (path: string) => void; // Prop for navigation
}

export default function AIGenerationForm({ onNavigate }: AIGenerationFormProps) {
  const [textInput, setTextInput] = useState<string>("");
  const [charCount, setCharCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setTextInput(newText);
    setCharCount(newText.length);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (textInput.length < MIN_CHARS || textInput.length > MAX_CHARS) {
      setError(`Tekst musi zawierać od ${MIN_CHARS} do ${MAX_CHARS} znaków.`);
      return;
    }

    setIsLoading(true);

    try {
      const command: GenerateFlashcardsCommand = { text: textInput };
      const response = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        let errorMessage = `Błąd serwera (status: ${response.status}). Spróbuj ponownie później.`;
        if (response.status === 400) {
          try {
            // Try to parse the error response from the server
            const errorData = await response.json();
            errorMessage =
              errorData.message || "Nieprawidłowe dane wejściowe. Upewnij się, że tekst ma od 1000 do 10000 znaków.";
          } catch {
            // If response is not JSON or doesn't have a message, use default
            errorMessage = "Nieprawidłowe dane wejściowe. Upewnij się, że tekst ma od 1000 do 10000 znaków.";
          }
        } else if (response.status === 401) {
          errorMessage = "Nie jesteś zalogowany lub Twoja sesja wygasła. Zaloguj się ponownie.";
        } else if (response.status === 503) {
          errorMessage = "Usługa generowania fiszek jest tymczasowo niedostępna. Spróbuj ponownie później.";
        }
        // For other non-ok statuses, the generic errorMessage is used.
        throw new Error(errorMessage);
      }

      const data: GenerateFlashcardsResponseDto = await response.json();

      // Step 7: Save suggestions to global store
      useAISuggestionsStore.getState().setSuggestions(textInput, data.suggestions);

      console.log("Wygenerowane sugestie zapisane w store:", data.suggestions);
      // alert(`Sugestie (${data.suggestions.length}) wygenerowane i zapisane!`);
      setTextInput("");
      setCharCount(0);

      // Step 8: Redirect using the passed navigate function
      if (onNavigate) {
        onNavigate("/ai/review-suggestions");
      } else {
        // Fallback if navigate is not provided, though it should be
        console.warn("Navigate function not provided, falling back to window.location.href");
        window.location.href = "/ai/review-suggestions";
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Wystąpił nieoczekiwany błąd. Sprawdź połączenie internetowe i spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid w-full gap-1.5">
        <Label htmlFor="text-input">Twój tekst źródłowy</Label>
        <Textarea
          id="text-input"
          placeholder={`Wklej tutaj swój tekst (min. ${MIN_CHARS} znaków, max. ${MAX_CHARS} znaków)`}
          value={textInput}
          onChange={handleInputChange}
          rows={15}
          className="resize-y min-h-[200px]"
          disabled={isLoading}
        />
        <p
          className={`text-sm ${charCount > MAX_CHARS || (charCount < MIN_CHARS && textInput.length > 0 && !isLoading) ? "text-destructive" : "text-muted-foreground"}`}
        >
          Liczba znaków: {charCount} / {MAX_CHARS}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          {/* <AlertCircle className="h-4 w-4" /> */}
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading || charCount < MIN_CHARS || charCount > MAX_CHARS}>
        {isLoading ? "Generowanie..." : "Generuj fiszki"}
      </Button>
    </form>
  );
}
