import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AIGenerationForm from "@/components/ai/AIGenerationForm"; // Adjust path as needed
import type { GenerateFlashcardsResponseDto } from "@/types";

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

// Mock useAISuggestionsStore
const mockSetSuggestions = vi.fn();
vi.mock("@/lib/store", () => ({
  useAISuggestionsStore: {
    getState: () => ({
      setSuggestions: mockSetSuggestions,
    }),
  },
}));

// Store original fetch
const originalFetch = global.fetch;

beforeEach(() => {
  mockSetSuggestions.mockClear();
  // Mock fetch before each test and restore after
  global.fetch = vi.fn();

  // Mock window.location using vi.stubGlobal
  vi.stubGlobal("location", {
    ...window.location, // Spread original location to keep other properties like assign, reload, etc.
    href: "", // Mock href specifically
  });
});

afterEach(() => {
  global.fetch = originalFetch; // Restore original fetch
  vi.unstubAllGlobals(); // Restore all globals, including window.location
});

describe("AIGenerationForm", () => {
  const getTextInput = () => screen.getByPlaceholderText(/Wklej tutaj swój tekst/);
  const getSubmitButton = () => screen.getByRole("button", { name: /Generuj fiszki/i });
  const getCharCountText = () => screen.getByText(/Liczba znaków:/);

  it("renders initial form correctly", () => {
    render(<AIGenerationForm />);
    expect(getTextInput()).toBeInTheDocument();
    expect(screen.getByLabelText(/Twój tekst źródłowy/i)).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
    expect(getSubmitButton()).toBeDisabled(); // Initially disabled due to char count
    expect(getCharCountText()).toHaveTextContent(`Liczba znaków: 0 / ${MAX_CHARS}`);
  });

  it("updates character count on input", () => {
    render(<AIGenerationForm />);
    const textArea = getTextInput();
    fireEvent.change(textArea, { target: { value: "test" } });
    expect(getCharCountText()).toHaveTextContent(`Liczba znaków: 4 / ${MAX_CHARS}`);
  });

  it("enables submit button when text length is within valid range", () => {
    render(<AIGenerationForm />);
    const textArea = getTextInput();
    const validText = "a".repeat(MIN_CHARS);
    fireEvent.change(textArea, { target: { value: validText } });
    expect(getSubmitButton()).toBeEnabled();
  });

  it("disables submit button and shows error style for text length below MIN_CHARS (on non-empty input)", () => {
    render(<AIGenerationForm />);
    const textArea = getTextInput();
    const shortText = "a".repeat(MIN_CHARS - 1);
    fireEvent.change(textArea, { target: { value: shortText } });
    expect(getSubmitButton()).toBeDisabled();
    expect(getCharCountText()).toHaveClass("text-destructive");
  });

  it("disables submit button and shows error style for text length above MAX_CHARS", () => {
    render(<AIGenerationForm />);
    const textArea = getTextInput();
    const longText = "a".repeat(MAX_CHARS + 1);
    fireEvent.change(textArea, { target: { value: longText } });
    expect(getSubmitButton()).toBeDisabled();
    expect(getCharCountText()).toHaveClass("text-destructive");
  });

  describe("Form Submission", () => {
    const validText = "a".repeat(MIN_CHARS);

    it("handles successful submission", async () => {
      const mockResponseData: GenerateFlashcardsResponseDto = {
        suggestions: [{ front: "Q1 Front", back: "A1 Back" }],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData,
      } as Response);

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      expect(screen.getByRole("button", { name: /Generowanie.../i })).toBeDisabled();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/ai/generate-flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: validText }),
        });
      });

      await waitFor(() => {
        expect(mockSetSuggestions).toHaveBeenCalledWith(validText, mockResponseData.suggestions);
      });

      await waitFor(() => {
        expect(getTextInput()).toHaveValue("");
        expect(getCharCountText()).toHaveTextContent(`Liczba znaków: 0 / ${MAX_CHARS}`);
        expect(window.location.href).toBe("/ai/review-suggestions");
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("handles API error (400 - Bad Request with custom message)", async () => {
      const errorMessage = "Nieprawidłowe dane wejściowe.";
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: errorMessage }),
      } as Response);

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      expect(mockSetSuggestions).not.toHaveBeenCalled();
      expect(window.location.href).not.toBe("/ai/review-suggestions");
    });

    it("handles API error (400 - Bad Request, default message)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}), // No message field
      } as Response);

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText("Nieprawidłowe dane wejściowe. Upewnij się, że tekst ma od 1000 do 10000 znaków.")
        ).toBeInTheDocument();
      });
    });

    it("handles API error (401 - Unauthorized)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText("Nie jesteś zalogowany lub Twoja sesja wygasła. Zaloguj się ponownie.")
        ).toBeInTheDocument();
      });
    });

    it("handles API error (503 - Service Unavailable)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response);

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText("Usługa generowania fiszek jest tymczasowo niedostępna. Spróbuj ponownie później.")
        ).toBeInTheDocument();
      });
    });

    it("handles generic server error (e.g., 500)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText("Błąd serwera (status: 500). Spróbuj ponownie później.")).toBeInTheDocument();
      });
    });

    it("handles network error (fetch throws)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network failure"));

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText("Network failure")).toBeInTheDocument();
      });
      expect(mockSetSuggestions).not.toHaveBeenCalled();
    });

    it("clears error when input changes after an error occurred", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Initial error" }),
      } as Response);

      render(<AIGenerationForm />);
      fireEvent.change(getTextInput(), { target: { value: validText } });
      fireEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText("Initial error")).toBeInTheDocument();
      });

      // Change input after error
      fireEvent.change(getTextInput(), { target: { value: validText + " more text" } });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
