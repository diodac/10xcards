# Plan Testów dla Projektu 10xcards

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji webowej "10xcards". Projekt wykorzystuje nowoczesny stos technologiczny oparty o Astro, React, Tailwind CSS, Shadcn/ui dla frontendu oraz Supabase jako backend i bazę danych, a także integruje się z usługą OpenRouter.ai dla funkcjonalności opartych o sztuczną inteligencję. Celem planu jest zapewnienie wysokiej jakości produktu finalnego poprzez systematyczne wykrywanie i raportowanie błędów.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

*   Weryfikacja, czy aplikacja spełnia zdefiniowane wymagania funkcjonalne i niefunkcjonalne.
*   Identyfikacja i zaraportowanie defektów oraz niespójności w aplikacji.
*   Zapewnienie stabilności, wydajności i bezpieczeństwa aplikacji.
*   Ocena użyteczności interfejsu użytkownika (UI) i doświadczenia użytkownika (UX).
*   Minimalizacja ryzyka wystąpienia krytycznych błędów na środowisku produkcyjnym.
*   Potwierdzenie poprawnej integracji z usługami zewnętrznymi (Supabase, OpenRouter.ai).
*   Zapewnienie, że kod jest zgodny z przyjętymi standardami i praktykami kodowania.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami:

*   **Autentykacja i autoryzacja użytkowników:**
    *   Rejestracja nowych użytkowników.
    *   Logowanie i wylogowywanie.
    *   Odzyskiwanie hasła (jeśli zaimplementowane).
    *   Zarządzanie sesją użytkownika.
    *   Ochrona dostępu do zasobów na podstawie ról (jeśli dotyczy).
*   **Główne funkcjonalności związane z AI (np. generowanie kart):**
    *   Interakcja z komponentami AI.
    *   Poprawność zapytań do API AI (`/api/ai/`).
    *   Obsługa odpowiedzi z usługi OpenRouter.ai.
    *   Prezentacja wyników użytkownikowi.
    *   Obsługa błędów i limitów związanych z AI.
*   **Interfejs użytkownika (UI) i nawigacja:**
    *   Poprawność wyświetlania wszystkich stron i komponentów.
    *   Działanie nawigacji (menu, linki, przyciski).
    *   Responsywność interfejsu na różnych urządzeniach (desktop, tablet, mobile).
    *   Spójność wizualna i zgodność z designem.
*   **API Endpoints (`src/pages/api/`):**
    *   Poprawność przetwarzania zapytań (GET, POST, PUT, DELETE itp.).
    *   Walidacja danych wejściowych.
    *   Poprawność formatu odpowiedzi.
    *   Obsługa błędów HTTP.
    *   Bezpieczeństwo endpointów (np. ochrona przed nieautoryzowanym dostępem).
*   **Interakcja z bazą danych Supabase:**
    *   Poprawność operacji CRUD (Create, Read, Update, Delete) poprzez API.
    *   Integralność danych.
*   **Logika biznesowa w `src/lib/`:**
    *   Poprawność działania serwisów.
    *   Działanie schematów walidacji.
    *   Funkcjonalność narzędzi pomocniczych.
*   **Middleware (`src/middleware/`):**
    *   Poprawność działania logiki middleware (np. obsługa autentykacji, logowanie).

### 2.2. Funkcjonalności nieobjęte testami (lub testowane w ograniczonym zakresie):

*   Wewnętrzna logika komponentów biblioteki Shadcn/ui (zakładamy, że są przetestowane przez twórców).
*   Wewnętrzne działanie i dokładność modeli AI dostarczanych przez OpenRouter.ai (skupiamy się na integracji i obsłudze odpowiedzi).
*   Testy obciążeniowe i wydajnościowe na dużą skalę (mogą być wprowadzone w późniejszej fazie, jeśli zajdzie taka potrzeba).
*   Szczegółowe testy kompatybilności ze starszymi lub niszowymi przeglądarkami (skupienie na najnowszych wersjach popularnych przeglądarek).

## 3. Typy Testów do Przeprowadzenia

*   **Testy Jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania poszczególnych, izolowanych fragmentów kodu (funkcje, moduły, komponenty React, logika w endpointach Astro).
    *   **Technologie/Narzędzia:** Vitest/Jest, React Testing Library.
    *   **Zakres:** Funkcje pomocnicze (`src/lib/utils/`), logika serwisów (`src/lib/services/`), schematy walidacji (`src/lib/schemas/`), logika komponentów React, logika w endpointach API Astro.
*   **Testy Integracyjne (Integration Tests):**
    *   **Cel:** Weryfikacja poprawnej współpracy pomiędzy różnymi modułami i komponentami systemu oraz z usługami zewnętrznymi.
    *   **Technologie/Narzędzia:** Vitest/Jest, React Testing Library, mockowanie usług zewnętrznych (np. MSW - Mock Service Worker).
    *   **Zakres:** Integracja komponentów frontendowych z API, współpraca serwisów, interakcja z mockowanym klientem Supabase i OpenRouter.ai.
*   **Testy End-to-End (E2E Tests):**
    *   **Cel:** Weryfikacja działania kompletnych przepływów użytkownika w aplikacji, symulując rzeczywiste interakcje.
    *   **Technologie/Narzędzia:** Playwright lub Cypress.
    *   **Zakres:** Kluczowe scenariusze użytkownika, np. rejestracja, logowanie, tworzenie/używanie kart AI, nawigacja po aplikacji.
*   **Testy API:**
    *   **Cel:** Bezpośrednie testowanie endpointów API (`src/pages/api/`) pod kątem poprawności zapytań, odpowiedzi, obsługi błędów i bezpieczeństwa.
    *   **Technologie/Narzędzia:** Postman, Newman, lub testy E2E/integracyjne uderzające bezpośrednio w API.
*   **Testy Akceptacyjne Użytkownika (UAT - User Acceptance Tests):**
    *   **Cel:** Potwierdzenie przez klienta/użytkowników końcowych, że aplikacja spełnia ich oczekiwania i wymagania.
    *   **Zakres:** Przeprowadzane na podstawie scenariuszy testowych przygotowanych wspólnie z interesariuszami.
*   **Testy Wizualne (Visual Regression Tests):**
    *   **Cel:** Wykrywanie niezamierzonych zmian w wyglądzie interfejsu użytkownika.
    *   **Technologie/Narzędzia:** Playwright/Cypress z integracją narzędzi do snapshot testing (np. Percy, Applitools, lub wbudowane funkcje).
    *   **Zakres:** Kluczowe strony i komponenty UI.
*   **Testy Bezpieczeństwa (Security Tests):**
    *   **Cel:** Identyfikacja podatności w aplikacji.
    *   **Technologie/Narzędzia:** Ręczne przeglądy kodu, narzędzia do skanowania podatności (np. OWASP ZAP, Snyk), testy penetracyjne (w zależności od budżetu i wymagań).
    *   **Zakres:** Autentykacja, autoryzacja, walidacja danych wejściowych, ochrona przed XSS, SQL Injection (nawet przy użyciu ORM), bezpieczeństwo API.
*   **Testy Wydajnościowe (Performance Tests - podstawowe):**
    *   **Cel:** Ocena czasu ładowania stron i responsywności aplikacji pod typowym obciążeniem.
    *   **Technologie/Narzędzia:** Lighthouse, WebPageTest, narzędzia deweloperskie przeglądarek.
    *   **Zakres:** Kluczowe strony, operacje wymagające dużej ilości zasobów (np. zapytania do AI).

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Autentykacja

| ID Scenariusza | Opis Scenariusza                                     | Kroki Testowe                                                                                                                                    | Oczekiwany Rezultat                                                                                                                               | Priorytet |
| :------------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :-------- |
| AUTH_001       | Pomyślna rejestracja nowego użytkownika                | 1. Przejdź na stronę rejestracji. 2. Wypełnij formularz poprawnymi danymi. 3. Kliknij przycisk "Zarejestruj".                                  | Użytkownik zostaje zarejestrowany, przekierowany na stronę logowania lub kokpitu, otrzymuje email potwierdzający (jeśli dotyczy).                | Krytyczny |
| AUTH_002       | Rejestracja z istniejącym adresem email              | 1. Przejdź na stronę rejestracji. 2. Wypełnij formularz adresem email, który już istnieje w systemie. 3. Kliknij przycisk "Zarejestruj".         | Wyświetlony zostaje komunikat błędu informujący, że email jest już zajęty. Użytkownik nie zostaje zarejestrowany.                             | Wysoki    |
| AUTH_003       | Pomyślne logowanie użytkownika                       | 1. Przejdź na stronę logowania. 2. Wprowadź poprawne dane logowania (email/hasło). 3. Kliknij przycisk "Zaloguj".                                  | Użytkownik zostaje zalogowany i przekierowany na odpowiednią stronę (np. kokpit).                                                                 | Krytyczny |
| AUTH_004       | Logowanie z niepoprawnym hasłem                      | 1. Przejdź na stronę logowania. 2. Wprowadź poprawny email i niepoprawne hasło. 3. Kliknij przycisk "Zaloguj".                                    | Wyświetlony zostaje komunikat błędu o niepoprawnych danych logowania. Użytkownik nie zostaje zalogowany.                                         | Wysoki    |
| AUTH_005       | Pomyślne wylogowanie użytkownika                     | 1. Będąc zalogowanym, kliknij przycisk "Wyloguj".                                                                                                 | Użytkownik zostaje wylogowany i przekierowany na stronę logowania lub stronę główną. Sesja użytkownika zostaje zakończona.                        | Wysoki    |
| AUTH_006       | Dostęp do chronionej strony bez zalogowania         | 1. Spróbuj uzyskać dostęp do strony wymagającej zalogowania (np. kokpit) bez aktywnej sesji.                                                     | Użytkownik zostaje przekierowany na stronę logowania. Dostęp do chronionej strony jest zablokowany.                                                  | Krytyczny |
| AUTH_007       | Dostęp do chronionej strony po zalogowaniu          | 1. Zaloguj się poprawnymi danymi. 2. Spróbuj uzyskać dostęp do strony wymagającej zalogowania.                                                    | Użytkownik ma dostęp do chronionej strony.                                                                                                         | Krytyczny |

### 4.2. Funkcjonalności AI (Przykład: Generowanie Kart)

| ID Scenariusza | Opis Scenariusza                                        | Kroki Testowe                                                                                                                                                           | Oczekiwany Rezultat                                                                                                                            | Priorytet |
| :------------- | :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| AI_001         | Pomyślne wygenerowanie karty przy użyciu AI               | 1. Zaloguj się do aplikacji. 2. Przejdź do funkcjonalności generowania kart. 3. Wprowadź poprawne dane wejściowe (np. temat, słowa kluczowe). 4. Kliknij przycisk "Generuj". | Karta zostaje wygenerowana i wyświetlona użytkownikowi. Dane karty są spójne z danymi wejściowymi.                                               | Krytyczny |
| AI_002         | Próba generowania karty z niekompletnymi danymi wejściowymi | 1. Zaloguj się. 2. Przejdź do generowania kart. 3. Pozostaw wymagane pola puste lub wprowadź niepoprawne dane. 4. Kliknij "Generuj".                                       | Wyświetlony zostaje komunikat błędu o konieczności wypełnienia wymaganych pól lub o niepoprawnym formacie danych. Karta nie jest generowana.       | Wysoki    |
| AI_003         | Obsługa błędu odpowiedzi z serwisu OpenRouter.ai        | 1. (Wymaga mockowania błędu API) Zaloguj się. 2. Spróbuj wygenerować kartę. 3. Symuluj błąd odpowiedzi z OpenRouter.ai.                                                 | Użytkownik widzi przyjazny komunikat o błędzie. Aplikacja nie ulega awarii.                                                                    | Wysoki    |
| AI_004         | Obsługa przekroczenia limitu zapytań do OpenRouter.ai   | 1. (Wymaga mockowania przekroczenia limitu) Zaloguj się. 2. Spróbuj wygenerować kartę. 3. Symuluj przekroczenie limitu API.                                             | Użytkownik widzi komunikat o przekroczeniu limitu lub tymczasowej niedostępności usługi.                                                      | Średni    |

*(Należy dodać więcej scenariuszy dla innych kluczowych funkcjonalności, np. zarządzanie profilami, interakcje z bazą danych przez UI itp.)*

## 5. Środowisko Testowe

*   **Środowisko deweloperskie (Local):** Używane przez programistów do codziennej pracy i uruchamiania testów jednostkowych/integracyjnych.
    *   System operacyjny: Zgodny z systemami deweloperów (macOS, Linux, Windows z WSL2).
    *   Przeglądarki: Najnowsze wersje Chrome, Firefox, Safari, Edge.
    *   Baza danych: Lokalna instancja Supabase (Docker) lub współdzielona instancja deweloperska Supabase.
    *   Node.js: Wersja zgodna z `.nvmrc`.
*   **Środowisko testowe/staging (Staging):** Odizolowane środowisko, możliwie jak najbardziej zbliżone do produkcyjnego. Używane do testów E2E, UAT, testów wydajnościowych i regresji.
    *   Hosting: DigitalOcean (zgodnie z tech-stack.md) lub inne dedykowane rozwiązanie.
    *   Baza danych: Dedykowana instancja Supabase dla środowiska staging.
    *   Konfiguracja: Zmienne środowiskowe skonfigurowane dla stagingu.
*   **Środowisko produkcyjne (Production):** Środowisko, z którego korzystają końcowi użytkownicy. Testy na produkcji powinny być ograniczone do smoke testów po wdrożeniu.

## 6. Narzędzia do Testowania

*   **Frameworki do testów jednostkowych i integracyjnych:**
    *   **Vitest** (preferowany dla projektów Vite/Astro) lub **Jest**.
    *   **React Testing Library** (do testowania komponentów React).
*   **Frameworki do testów E2E:**
    *   **Playwright** (rekomendowany ze względu na szybkość i możliwości) lub **Cypress**.
*   **Narzędzia do testowania API:**
    *   **Postman** (do manualnych testów i eksploracji API).
    *   **Newman** (do automatyzacji testów Postman w CI/CD).
    *   Możliwość wykorzystania Playwright/Cypress do testów API.
*   **Mockowanie:**
    *   **MSW (Mock Service Worker)** (do mockowania API na poziomie sieci).
    *   Wbudowane mechanizmy mockowania w Vitest/Jest.
*   **Testy wizualne:**
    *   **Playwright/Cypress** z integracją narzędzi do snapshot testing (np. wbudowane funkcje, Percy, Applitools).
*   **CI/CD:**
    *   **GitHub Actions** (do automatycznego uruchamiania testów po każdym pushu/pull requeście).
*   **Zarządzanie testami i raportowanie błędów:**
    *   **Jira**, **Trello**, **GitHub Issues** lub inne narzędzie do zarządzania projektami i śledzenia błędów.
*   **Linters i Formattery:**
    *   **ESLint**, **Prettier** (zapewnienie jakości kodu, co pośrednio wpływa na mniej błędów).
*   **Narzędzia deweloperskie przeglądarek:** (Chrome DevTools, Firefox Developer Tools) do debugowania i inspekcji.

## 7. Harmonogram Testów

Harmonogram testów powinien być zintegrowany z cyklem rozwoju oprogramowania (np. Sprinty w Agile).

*   **Testy jednostkowe i integracyjne:** Przeprowadzane ciągle przez deweloperów podczas pisania kodu. Powinny być częścią definicji "ukończenia" zadania (Definition of Done).
*   **Testy API:** Przeprowadzane równolegle z rozwojem endpointów.
*   **Testy E2E:** Rozwijane i uruchamiane regularnie, przynajmniej raz na sprint/iterację, oraz przed każdym wydaniem.
*   **Testy regresji:** Przeprowadzane przed każdym wydaniem, aby upewnić się, że nowe zmiany nie zepsuły istniejących funkcjonalności.
*   **Testy akceptacyjne użytkownika (UAT):** Przeprowadzane na środowisku staging pod koniec cyklu rozwojowego, przed wdrożeniem na produkcję.
*   **Smoke Tests:** Przeprowadzane na środowisku produkcyjnym bezpośrednio po każdym wdrożeniu.

*Dokładny harmonogram z datami będzie zależał od planu rozwoju projektu.*

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcia Testów)

*   Dostępna jest stabilna wersja aplikacji na odpowiednim środowisku testowym.
*   Dokumentacja wymagań i specyfikacje funkcjonalne są dostępne i zrozumiałe.
*   Środowisko testowe jest skonfigurowane i gotowe do użycia.
*   Dane testowe są przygotowane.
*   Plan testów został zaakceptowany.

### 8.2. Kryteria Wyjścia (Zakończenia Testów)

*   Wszystkie zaplanowane scenariusze testowe zostały wykonane.
*   Określony procent testów zakończył się sukcesem (np. 100% dla testów krytycznych i wysokiego priorytetu, >95% dla pozostałych).
*   Wszystkie zidentyfikowane błędy krytyczne i o wysokim priorytecie zostały naprawione i ponownie przetestowane (re-test).
*   Znane błędy o niskim/średnim priorytecie są udokumentowane i zaakceptowane przez interesariuszy (jeśli nie zostaną naprawione w bieżącym cyklu).
*   Raport z testów został przygotowany i przedstawiony interesariuszom.
*   Spełnione zostały kryteria UAT (jeśli dotyczy).

## 9. Role i Odpowiedzialności w Procesie Testowania

*   **Deweloperzy:**
    *   Odpowiedzialni za pisanie i uruchamianie testów jednostkowych i integracyjnych dla swojego kodu.
    *   Naprawianie błędów zgłoszonych przez testerów.
    *   Dbanie o jakość kodu i przestrzeganie standardów.
*   **Inżynier QA / Tester:**
    *   Tworzenie i utrzymywanie planu testów oraz scenariuszy testowych.
    *   Projektowanie, implementacja i wykonywanie testów (manualnych i automatycznych: E2E, API, wizualnych).
    *   Raportowanie i śledzenie błędów.
    *   Analiza wyników testów i przygotowywanie raportów.
    *   Współpraca z deweloperami w celu zrozumienia funkcjonalności i rozwiązywania problemów.
    *   Uczestnictwo w definiowaniu kryteriów akceptacji.
*   **Product Owner / Manager Projektu:**
    *   Definiowanie wymagań i priorytetów.
    *   Uczestnictwo w UAT.
    *   Podejmowanie decyzji dotyczących zakresu testów i akceptacji ryzyka związanego z błędami.
*   **Użytkownicy Końcowi / Interesariusze:**
    *   Uczestnictwo w testach akceptacyjnych użytkownika (UAT).
    *   Dostarczanie informacji zwrotnej na temat funkcjonalności i użyteczności aplikacji.

## 10. Procedury Raportowania Błędów

### 10.1. Cykl Życia Błędu

1.  **Nowy (New):** Błąd został zidentyfikowany i zgłoszony.
2.  **Otwarty (Open/Assigned):** Błąd został zweryfikowany i przypisany do dewelopera.
3.  **W Trakcie Naprawy (In Progress/Fixed):** Deweloper pracuje nad naprawą błędu lub już go naprawił.
4.  **Do Ponownego Testu (Ready for Retest/Resolved):** Błąd został naprawiony i jest gotowy do ponownego przetestowania przez QA.
5.  **Zamknięty (Closed):** Błąd został pomyślnie naprawiony i zweryfikowany.
6.  **Odrzucony (Rejected):** Zgłoszenie nie jest błędem lub jest duplikatem.
7.  **Odroczony (Deferred):** Naprawa błędu została przełożona na późniejszy termin.

### 10.2. Format Zgłoszenia Błędu

Każdy zgłoszony błąd powinien zawierać następujące informacje:

*   **ID Błędu:** Unikalny identyfikator.
*   **Tytuł:** Zwięzły opis problemu.
*   **Opis:** Szczegółowy opis błędu, w tym:
    *   **Kroki do odtworzenia (Steps to Reproduce):** Dokładna sekwencja czynności prowadzących do wystąpienia błędu.
    *   **Rzeczywisty Rezultat (Actual Result):** Co się stało po wykonaniu kroków.
    *   **Oczekiwany Rezultat (Expected Result):** Co powinno się stać.
*   **Środowisko:** Wersja aplikacji, przeglądarka (wersja), system operacyjny, urządzenie.
*   **Priorytet:** (np. Krytyczny, Wysoki, Średni, Niski) - jak pilna jest naprawa.
*   **Ważność/Dotkliwość (Severity):** (np. Blokujący, Poważny, Drobny, Kosmetyczny) - jak duży wpływ ma błąd na działanie aplikacji.
*   **Zgłaszający:** Osoba, która znalazła błąd.
*   **Przypisany do:** Deweloper odpowiedzialny za naprawę.
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi.
*   **Wersja aplikacji/Build:** Wersja, w której błąd został znaleziony.

### 10.3. Narzędzie do Raportowania

Błędy będą raportowane i śledzone przy użyciu narzędzia **GitHub Issues** z odpowiednimi etykietami (`bug`, `priority:high`, `severity:critical`, `status:open` etc.).