# Specyfikacja Techniczna: Moduł Uwierzytelniania 10xCards

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu uwierzytelniania (rejestracja, logowanie, odzyskiwanie hasła) dla aplikacji 10xCards. Rozwiązanie opiera się na wymaganiach zdefiniowanych w PRD (US-005) oraz stacku technologicznym (Supabase, Astro, React).

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Layouty

-   **`src/layouts/AuthLayout.astro`**:
    -   Przeznaczenie: Strony publiczne związane z uwierzytelnianiem (logowanie, rejestracja, odzyskiwanie hasła).
    -   Charakterystyka: Minimalistyczny layout, bez elementów nawigacji wymagających zalogowania. Może zawierać logo aplikacji i stopkę.
-   **`src/layouts/AppLayout.astro`**:
    -   Przeznaczenie: Strony dostępne dla zalogowanych użytkowników.
    -   Charakterystyka: Pełny layout aplikacji, zawierający główną nawigację, dostęp do profilu użytkownika oraz przycisk wylogowania. Treść chroniona będzie renderowana w `<slot />`.

### 2.2. Strony (Astro)

-   **`src/pages/login.astro`**:
    -   Cel: Strona logowania.
    -   Layout: `AuthLayout.astro`.
    -   Komponenty: Zawiera komponent `<LoginForm client:load />`.
    -   Logika: Przekierowuje do panelu użytkownika (`/dashboard`) jeśli użytkownik jest już zalogowany (obsługa w middleware lub na stronie).
-   **`src/pages/register.astro`**:
    -   Cel: Strona rejestracji.
    -   Layout: `AuthLayout.astro`.
    -   Komponenty: Zawiera komponent `<RegisterForm client:load />`.
    -   Logika: Przekierowuje do panelu użytkownika (`/dashboard`) jeśli użytkownik jest już zalogowany.
-   **`src/pages/forgot-password.astro`**:
    -   Cel: Strona formularza odzyskiwania hasła.
    -   Layout: `AuthLayout.astro`.
    -   Komponenty: Zawiera komponent `<ForgotPasswordForm client:load />`.
-   **`src/pages/reset-password.astro`**:
    -   Cel: Strona do ustawiania nowego hasła po kliknięciu linku z emaila.
    -   Layout: `AuthLayout.astro`.
    -   Komponenty: Zawiera komponent `<ResetPasswordForm client:load />`.
    -   Logika: Odczytuje token resetu z parametrów URL.
-   **`src/pages/email-confirm.astro` (Opcjonalnie, jeśli włączona jest weryfikacja email w Supabase):**
    -   Cel: Strona informująca o konieczności potwierdzenia adresu email lub o statusie potwierdzenia.
    -   Layout: `AuthLayout.astro`.
    -   Logika: Może obsługiwać token potwierdzenia z URL, jeśli Supabase tego wymaga bezpośrednio na frontendzie.

### 2.3. Komponenty (React)

Wszystkie komponenty formularzy będą zlokalizowane w `src/components/auth/`.

-   **`LoginForm.tsx`**:
    -   Odpowiedzialność: Renderowanie formularza logowania (email, hasło), walidacja po stronie klienta, obsługa wysyłania danych do Supabase (`signInWithPassword`), wyświetlanie błędów i komunikatów o sukcesie.
    -   Integracja: Wykorzystuje klienta Supabase JS. Po pomyślnym zalogowaniu, nawiguje użytkownika do panelu (`/dashboard`) lub odświeża stan globalny aplikacji.
-   **`RegisterForm.tsx`**:
    -   Odpowiedzialność: Renderowanie formularza rejestracji (email, hasło, powtórz hasło), walidacja po stronie klienta, obsługa wysyłania danych do Supabase (`signUp`), wyświetlanie błędów i komunikatów (np. "Sprawdź email w celu potwierdzenia rejestracji").
    -   Integracja: Wykorzystuje klienta Supabase JS.
-   **`ForgotPasswordForm.tsx`**:
    -   Odpowiedzialność: Renderowanie formularza z polem na email, walidacja, wysyłanie żądania resetu hasła do Supabase (`resetPasswordForEmail`), wyświetlanie komunikatów.
    -   Integracja: Wykorzystuje klienta Supabase JS.
-   **`ResetPasswordForm.tsx`**:
    -   Odpowiedzialność: Renderowanie formularza do wprowadzenia nowego hasła (hasło, powtórz hasło), walidacja, wysyłanie nowego hasła do Supabase (`updateUser`), korzystając z tokena odzyskiwania (przekazanego jako prop z Astro page).
    -   Integracja: Wykorzystuje klienta Supabase JS.
-   **`src/components/UserProfileButton.tsx` (Rozszerzenie/Nowy)**:
    -   Odpowiedzialność: Wyświetlanie awatara/inicjałów użytkownika (jeśli zalogowany) lub przycisku "Zaloguj się". Dla zalogowanego użytkownika, oferuje menu z opcjami "Profil" (jeśli dotyczy) i "Wyloguj się".
    -   Integracja: Komponent nasłuchuje zmian stanu uwierzytelnienia Supabase (`onAuthStateChange`) lub korzysta z globalnego store'a. Przycisk "Wyloguj" wywołuje `supabase.auth.signOut()`.

### 2.4. Walidacja i Komunikaty Błędów

-   **Walidacja Client-Side (React Forms)**:
    -   Pola wymagane (np. email, hasło).
    -   Format email.
    -   Minimalna długość i złożoność hasła (zgodnie z polityką Supabase).
    -   Zgodność haseł (rejestracja, zmiana hasła).
    -   Komunikaty wyświetlane bezpośrednio przy polach formularza.
-   **Komunikaty z Supabase (Server-Side)**:
    -   "Nieprawidłowy email lub hasło."
    -   "Użytkownik o podanym adresie email już istnieje."
    -   "Link do resetowania hasła został wysłany."
    -   "Token resetowania hasła jest nieprawidłowy lub wygasł."
    -   "Wystąpił błąd serwera. Spróbuj ponownie później."
    -   Komunikaty wyświetlane w dedykowanym miejscu w formularzu lub jako globalne powiadomienia (toasty).

### 2.5. Scenariusze Użytkownika

1.  **Rejestracja**:
    -   Użytkownik wypełnia formularz na `/register`.
    -   Walidacja client-side.
    -   Wysyłka danych do Supabase.
    -   Supabase wysyła email weryfikacyjny (jeśli skonfigurowano).
    -   Użytkownik widzi komunikat o konieczności potwierdzenia emaila / o sukcesie rejestracji.
2.  **Logowanie**:
    -   Użytkownik wypełnia formularz na `/login`.
    -   Walidacja client-side.
    -   Wysyłka danych do Supabase.
    -   Po sukcesie: Supabase ustawia sesję (cookie), użytkownik jest przekierowywany do `/dashboard`.
    -   Po błędzie: Wyświetlenie komunikatu błędu.
3.  **Wylogowanie**:
    -   Użytkownik klika "Wyloguj się".
    -   Wywołanie `supabase.auth.signOut()`.
    -   Sesja jest usuwana, użytkownik przekierowywany na `/login`.
4.  **Odzyskiwanie Hasła**:
    -   Użytkownik na `/forgot-password` podaje email.
    -   Wysyłka żądania do Supabase.
    -   Supabase wysyła email z linkiem do resetu.
    -   Użytkownik klika link, trafia na `/reset-password?token=...`.
    -   Użytkownik ustawia nowe hasło.
    -   Po sukcesie, jest informowany i może się zalogować.
5.  **Dostęp do Chronionych Stron**:
    -   Niezalogowany użytkownik próbujący wejść na `/dashboard` jest przekierowywany na `/login`.
    -   Zalogowany użytkownik próbujący wejść na `/login` jest przekierowywany na `/dashboard`.

## 3. Logika Backendowa

Supabase Auth w dużej mierze pełni rolę backendu dla operacji uwierzytelniania. Niemniej, pewne elementy po stronie serwera Astro będą konieczne.

### 3.1. Endpointy API

Większość operacji (signup, login, logout, password reset) jest obsługiwana przez wbudowane endpointy Supabase Auth. Nie ma potrzeby tworzenia dedykowanych endpointów API w Astro dla tych podstawowych operacji, gdyż Supabase JS SDK komunikuje się z nimi bezpośrednio.

Możliwe własne endpointy (jeśli zajdzie potrzeba):

-   **`src/pages/api/auth/session.ts` (GET)**:
    -   Cel: Endpoint serwerowy do pobierania danych o sesji użytkownika, jeśli klient potrzebuje tych informacji w specyficzny sposób, który nie jest łatwo dostępny przez Supabase JS (rzadko potrzebne).
    -   Logika: Używa admin clienta Supabase lub `supabase.auth.getUser()` po stronie serwera do weryfikacji sesji z cookie.
    -   Odpowiedź: `{ user: User | null }`.

### 3.2. Modele Danych

Główne modele danych są zarządzane przez Supabase:

-   `auth.users`: Przechowuje informacje o użytkownikach.
-   `auth.sessions`: Przechowuje aktywne sesje.
-   Możemy rozszerzyć profil użytkownika o dodatkowe dane, tworząc tabelę `user_profiles` w schemacie `public` i łącząc ją z `auth.users` relacją one-to-one (ID użytkownika jako klucz obcy). To wykracza poza US-005, ale warto o tym pamiętać.

### 3.3. Walidacja Danych Wejściowych

-   Walidacja po stronie Supabase (np. unikalność emaila, polityka haseł).
-   Walidacja po stronie klienta w formularzach React (jak opisano w sekcji 2.4).
-   Dla ewentualnych własnych endpointów API w Astro, walidacja powinna być przeprowadzana przy użyciu bibliotek takich jak Zod.

### 3.4. Obsługa Wyjątków

-   React komponenty powinny łapać błędy z Supabase JS SDK i wyświetlać odpowiednie komunikaty.
-   Middleware Astro powinien poprawnie obsługiwać błędy związane z sesją.

### 3.5. Renderowanie Server-Side i Middleware

Zakładając, że `astro.config.mjs` jest skonfigurowane dla SSR (`output: 'server'` lub `output: 'hybrid'`).

-   **`src/middleware/index.ts`**:
    -   Odpowiedzialność: Ochrona tras, zarządzanie przekierowaniami w oparciu o status uwierzytelnienia.
    -   Logika:
        1.  Inicjalizacja klienta Supabase po stronie serwera przy użyciu ciasteczek z żądania (`Astro.cookies`).
        2.  Pobranie informacji o sesji/użytkowniku: `const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;`.
        3.  Zapisanie klienta Supabase i informacji o użytkowniku w `Astro.locals` (np. `Astro.locals.supabase`, `Astro.locals.user`, `Astro.locals.session`).
        4.  Sprawdzenie ścieżki żądania (`Astro.url.pathname`):
            -   Jeśli ścieżka jest chroniona (np. `/dashboard/*`, `/account/*`) i `!user`: przekieruj do `/login`.
            -   Jeśli ścieżka to strona autoryzacyjna (np. `/login`, `/register`) i `user`: przekieruj do `/dashboard`.
        5.  Przekazanie żądania dalej (`next()`).
    -   Przykład fragmentu middleware:

        ```typescript
        // src/middleware/index.ts
        import { defineMiddleware } from 'astro:middleware';
        import { createSupabaseClient } from '@/lib/supabaseServerClient'; // Funkcja tworząca klienta Supabase na serwerze

        const protectedRoutes = ['/dashboard', '/app']; // Przykładowe chronione ścieżki
        const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

        export const onRequest = defineMiddleware(async (context, next) => {
            const supabase = createSupabaseClient(context.cookies); // Tworzy klienta Supabase używając cookies
            context.locals.supabase = supabase;

            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            context.locals.session = session;
            context.locals.user = user;

            const currentPath = context.url.pathname;

            if (protectedRoutes.some(path => currentPath.startsWith(path)) && !user) {
                return context.redirect('/login');
            }

            if (authRoutes.some(path => currentPath.startsWith(path)) && user) {
                return context.redirect('/dashboard'); // lub inna strona główna dla zalogowanych
            }

            const response = await next();
            // Możliwość modyfikacji odpowiedzi, np. dodanie nagłówków związanych z sesją Supabase
            return response;
        });
        ```

-   **Dostęp do danych użytkownika w stronach Astro (server-side):**
    Strony Astro mogą uzyskać dostęp do `Astro.locals.user` i `Astro.locals.session` w celu renderowania treści warunkowo lub pobierania danych specyficznych dla użytkownika.

    ```astro
    ---
    // src/pages/dashboard.astro
    import AppLayout from '@/layouts/AppLayout.astro';
    const { user } = Astro.locals; // Dostępne dzięki middleware

    if (!user) {
        // Chociaż middleware powinien to obsłużyć, dodatkowe zabezpieczenie
        return Astro.redirect('/login');
    }
    ---
    <AppLayout title="Dashboard">
        <h1>Witaj, {user.email}!</h1>
        <!-- Treść dashboardu -->
    </AppLayout>
    ```

## 4. System Autentykacji (Supabase Auth + Astro)

### 4.1. Konfiguracja Klienta Supabase

-   **`src/lib/supabaseClient.ts` (Client-side)**:
    -   Inicjalizuje i eksportuje klienta Supabase JS. Klucze API (public anon key i URL) powinny być przechowywane w zmiennych środowiskowych (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`).

    ```typescript
    // src/lib/supabaseClient.ts
    import { createBrowserClient } from '@supabase/ssr';

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    ```

-   **`src/lib/supabaseServerClient.ts` (Server-side, dla middleware i endpointów API)**:
    -   Funkcja do tworzenia klienta Supabase na serwerze, który może odczytywać i zapisywać cookies sesji.

    ```typescript
    // src/lib/supabaseServerClient.ts
    import { createServerClient, type CookieOptions } from '@supabase/ssr';
    import type { AstroCookies } from 'astro';

    export function createSupabaseClient(cookies: AstroCookies) {
        const supabaseUrl = import.meta.env.SUPABASE_URL; // Może być taki sam jak PUBLIC_, ale często backendowe zmienne są oddzielne
        const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY; // Jeśli potrzebne operacje jako admin, w przeciwnym razie anon key

        return createServerClient(
            supabaseUrl,
            // Użyj klucza anon dla operacji użytkownika, service_role dla operacji administracyjnych
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY, 
            {
                cookies: {
                    get(key: string) {
                        return cookies.get(key)?.value;
                    },
                    set(key: string, value: string, options: CookieOptions) {
                        cookies.set(key, value, options);
                    },
                    remove(key: string, options: CookieOptions) {
                        cookies.delete(key, options);
                    },
                },
            }
        );
    }
    ```
    Należy upewnić się, że zmienne środowiskowe `SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (i opcjonalnie `SUPABASE_SERVICE_ROLE_KEY`) są zdefiniowane w pliku `.env`.

### 4.2. Procesy Autentykacji

-   **Rejestracja**: `RegisterForm.tsx` -> `supabase.auth.signUp()` -> Supabase Auth backend.
-   **Logowanie**: `LoginForm.tsx` -> `supabase.auth.signInWithPassword()` -> Supabase Auth backend -> Ustawienie cookie sesji.
-   **Wylogowanie**: Kliknięcie przycisku -> `supabase.auth.signOut()` -> Supabase Auth backend -> Usunięcie cookie sesji.
-   **Odzyskiwanie Hasła**:
    -   `ForgotPasswordForm.tsx` -> `supabase.auth.resetPasswordForEmail()` -> Supabase wysyła email.
    -   Użytkownik klika link -> `reset-password.astro` (odczytuje token) -> `ResetPasswordForm.tsx` (przekazuje token) -> `supabase.auth.updateUser({ password: newPassword })` (Supabase JS SDK automatycznie obsłuży token, jeśli użytkownik jest na sesji odzyskiwania hasła po kliknięciu linka).
-   **Obsługa Sesji**:
    -   Supabase JS SDK automatycznie zarządza sesją w przeglądarce (localStorage/sessionStorage) i odświeża tokeny.
    -   Middleware Astro (`src/middleware/index.ts`) zapewnia spójność sesji po stronie serwera, odczytując ją z cookies ustawionych przez Supabase. Biblioteka `@supabase/ssr` pomaga w synchronizacji cookies między klientem a serwerem.

### 4.3. Konfiguracja Supabase

-   W panelu Supabase (Authentication -> Providers):
    -   Włączyć dostawcę "Email".
    -   Opcjonalnie: Włączyć "Confirm email" (zalecane). Jeśli włączone, użytkownicy będą musieli kliknąć link w emailu, aby aktywować konto. Należy dostosować stronę `src/pages/email-confirm.astro` lub komunikaty na stronie rejestracji/logowania.
    -   Skonfigurować szablony emaili (potwierdzenie, reset hasła) w Supabase (Authentication -> Email Templates).
    -   Site URL: Ustawić na URL produkcyjny aplikacji (np. `https://twoja-aplikacja.com`).
    -   Redirect URLs: Dodać URL'e, na które Supabase może przekierowywać po pewnych akcjach, np. `https://twoja-aplikacja.com/auth/callback` (jeśli używamy OAuth), `https://twoja-aplikacja.com/*` (dla ogólnych przekierowań po potwierdzeniu emaila, itp.). W przypadku email/password i obsługi po stronie klienta, precyzyjne redirect URLs dla tych operacji są mniej krytyczne, ale Site URL jest ważny dla linków w emailach.

## 5. Bezpieczeństwo

-   Użycie HTTPS na produkcji.
-   Przechowywanie kluczy API Supabase (szczególnie `SERVICE_ROLE_KEY`) jako zmiennych środowiskowych i nie ujawnianie ich po stronie klienta. `ANON_KEY` jest publiczny.
-   Regularne aktualizacje zależności (@supabase/supabase-js, @supabase/ssr, Astro, React).
-   Walidacja wszystkich danych wejściowych po stronie serwera (Supabase robi to dla auth).
-   Implementacja polityki siły haseł (konfigurowalna w Supabase).
-   Ochrona przed atakami CSRF (Astro i Supabase mają wbudowane mechanizmy, ale warto być świadomym).
-   Ochrona przed XSS przez poprawne escapowanie danych wyjściowych (React i Astro domyślnie to robią).

## 6. Kluczowe Wnioski

-   Funkcjonalność rejestracji, logowania i odzyskiwania hasła zostanie zrealizowana przy użyciu Supabase Auth.
-   Interfejs użytkownika będzie składał się ze stron Astro hostujących interaktywne komponenty React dla formularzy.
-   Astro middleware będzie kluczowe dla ochrony tras i zarządzania sesją po stronie serwera.
-   Klienci Supabase (client-side i server-side z `@supabase/ssr`) umożliwią interakcję z usługą Supabase Auth.
-   Należy zadbać o odpowiednią konfigurację zmiennych środowiskowych i ustawień w panelu Supabase.

Ta specyfikacja stanowi podstawę do implementacji modułu uwierzytelniania. W trakcie rozwoju mogą pojawić się dodatkowe szczegóły lub modyfikacje. 