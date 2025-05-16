import React, { useState } from "react";

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let isValid = true;

    if (!email) {
      setEmailError("Adres email jest wymagany.");
      isValid = false;
    }
    // Basic email validation regex (corrected escape)
    else if (!/^[\w-.@]+([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setEmailError("Podaj poprawny adres email.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Hasło jest wymagane.");
      isValid = false;
    }
    // Example: Minimum password length
    else if (password.length < 6) {
      setPasswordError("Hasło musi mieć co najmniej 6 znaków.");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Potwierdzenie hasła jest wymagane.");
      isValid = false;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Hasła nie są zgodne.");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Get the raw text of the response first to see what's coming back
      const responseText = await response.text();
      let data;

      try {
        // Try to parse it as JSON
        data = JSON.parse(responseText);
      } catch (e) {
        // If JSON parsing fails, this is the SyntaxError
        console.error("Failed to parse JSON response. Server sent:", responseText, "Error:", e);
        if (!response.ok) {
          setFormError(`Błąd serwera (${response.status}). Odpowiedź nie była w formacie JSON. Spróbuj ponownie.`);
        } else {
          // Response was ok, but not valid JSON. This is unusual for our API.
          setFormError("Otrzymano nieprawidłową odpowiedź z serwera (nie JSON).");
        }
        return;
      }

      if (!response.ok) {
        // We have JSON data, but the request was not "ok" (e.g., 400, 401, 500)
        if (data && data.error) {
          // Specific error handling based on Supabase messages if needed
          if (data.error.toLowerCase().includes("user already registered")) {
            setEmailError("Użytkownik o tym adresie email już istnieje.");
          } else if (data.error.toLowerCase().includes("password should be at least 6 characters")) {
            setPasswordError("Hasło musi mieć co najmniej 6 znaków.");
          } else {
            setFormError(data.error || `Wystąpił błąd podczas rejestracji (${response.status}).`);
          }
        } else {
          // Non-ok response, but no specific 'error' field in the JSON
          setFormError(`Błąd serwera (${response.status}). Spróbuj ponownie.`);
        }
        return;
      }

      // Successful registration (response.ok is true and we have JSON data)
      // Supabase session cookie should be set by the API route
      // Redirect to dashboard or flashcards page
      window.location.href = "/decks"; // Or your flashcards page
    } catch (error) {
      // This catch is for network errors or if fetch itself fails (e.g., server not reachable).
      console.error("Registration fetch network error:", error);
      setFormError("Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && <p className="text-red-400 text-sm text-center">{formError}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-blue-100/90">
          Adres email
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // required // HTML5 validation can be kept or removed if custom handling is preferred
            className={`auth-input ${emailError ? "border-red-500" : ""}`}
            placeholder="ty@example.com"
          />
          {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-blue-100/90">
          Hasło
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // required
            className={`auth-input ${passwordError ? "border-red-500" : ""}`}
            placeholder="••••••••"
          />
          {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-100/90">
          Potwierdź hasło
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            // required
            className={`auth-input ${confirmPasswordError ? "border-red-500" : ""}`}
            placeholder="••••••••"
          />
          {confirmPasswordError && <p className="mt-1 text-xs text-red-400">{confirmPasswordError}</p>}
        </div>
      </div>

      <div>
        <button type="submit" className="auth-button">
          Zarejestruj się
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
