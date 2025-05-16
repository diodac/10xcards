import React, { useState } from "react";

interface RegisterFormProps {
  onNavigate?: (path: string) => void; // Prop for navigation
}

export default function RegisterForm({ onNavigate }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Rejestracja nie powiodła się");
      }

      // Registration successful
      console.log("Registration successful for user:", data.user);
      // alert("Registration successful! Please log in."); // Consider better UX

      // Redirect to login page or directly to a protected page if session is created
      if (onNavigate) {
        // Assuming direct navigation to a page after registration if session is auto-created
        onNavigate("/ai/generate"); // Or your flashcards page
      } else {
        console.warn("Navigate function not provided, falling back to window.location.href");
        window.location.href = "/ai/generate"; // Or your flashcards page
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Wystąpił nieoczekiwany błąd.");
      }
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
          {confirmPasswordError && <p className="mt-1 text-xs text-red-400">{confirmPasswordError}</p>}
        </div>
      </div>

      <div>
        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading ? "Rejestracja..." : "Zarejestruj się"}
        </button>
      </div>
    </form>
  );
}
