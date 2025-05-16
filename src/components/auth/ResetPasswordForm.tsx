import React from "react";

// Props will be added later when token handling is implemented
const ResetPasswordForm: React.FC = () => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Handle form submission to Supabase, using the token
    console.log("Reset password form submitted");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-blue-100/90">
          Nowe hasło
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="auth-input"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-100/90">
          Potwierdź nowe hasło
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="auth-input"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <button type="submit" className="auth-button">
          Ustaw nowe hasło
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
