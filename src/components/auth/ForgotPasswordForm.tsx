import React from "react";

const ForgotPasswordForm: React.FC = () => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Handle form submission to Supabase
    console.log("Forgot password form submitted");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          />
        </div>
      </div>

      <div>
        <button type="submit" className="auth-button">
          Wyślij link do resetu hasła
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
