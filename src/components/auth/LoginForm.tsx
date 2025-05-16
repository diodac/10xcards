import React, { useState } from "react";

interface LoginFormProps {
  onNavigate?: (path: string) => void; // Prop for navigation
}

export default function LoginForm({ onNavigate }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logowanie nie powiodło się");
      }

      // Login successful
      console.log("Login successful:", data.user);
      // Redirect to dashboard or another protected page
      if (onNavigate) {
        onNavigate("/ai/generate"); // As per auth-spec.md and prd.md
      } else {
        console.warn("Navigate function not provided, falling back to window.location.href");
        window.location.href = "/ai/generate"; // As per auth-spec.md and prd.md
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Wystąpił nieoczekiwany błąd.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-400 bg-red-500/10 p-3 text-center text-sm text-red-400">
          {error}
        </div>
      )}
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
            required
            className="auth-input"
            placeholder="ty@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
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
            autoComplete="current-password"
            required
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <a href="/forgot-password" className="auth-link">
            Nie pamiętasz hasła?
          </a>
        </div>
      </div>

      <div>
        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </div>
    </form>
  );
}
