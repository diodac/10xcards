# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika dla 10x-cards została zaprojektowana z naciskiem na prostotę, intuicyjność i dostępność. UI podzielony jest na kilka kluczowych widoków, które pokrywają wszystkie etapy korzystania z aplikacji – od logowania, przez zarządzanie zestawami fiszek, aż po sesję nauki. Projekt uwzględnia najlepsze praktyki UX, responsywność oraz bezpieczeństwo, a także integrację z backendowymi API zapewniającymi autoryzację i manipulację danymi.

## 2. Lista widoków

### Ekran logowania/rejestracji
- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwienie użytkownikowi uwierzytelnienia się poprzez logowanie lub rejestrację za pomocą email.
- **Kluczowe informacje:** Formularz logowania z polami email i hasło, informacje o błędach, przyciski "Zaloguj" i "Zarejestruj".
- **Kluczowe komponenty:** Formularz uwierzytelnienia, kontrolki inline walidacji, przyciski, komunikaty o błędach.
- **UX, dostępność i bezpieczeństwo:** Prosty i przejrzysty interfejs, zgodność z WCAG, wysoka czytelność, zabezpieczenia przed nieautoryzowanym dostępem.

### Dashboard (strona główna po zalogowaniu)
- **Ścieżka widoku:** `/dashboard`
- **Główny cel:** Centralny punkt orientacyjny z dostępem do głównych funkcji aplikacji.
- **Kluczowe informacje:** Podsumowanie zestawów fiszek, szybki dostęp do głównych funkcji (sesja nauki, lista zestawów), notyfikacje.
- **Kluczowe komponenty:** Topbar (z nazwą serwisu i menu profilu), główny panel informacyjny, skróty do najważniejszych funkcji.
- **UX, dostępność i bezpieczeństwo:** Intuicyjne rozmieszczenie elementów, responsywność, łatwy dostęp do najważniejszych akcji oraz zabezpieczenia poprzez mechanizmy autoryzacji.

### Widok listy zestawów fiszek
- **Ścieżka widoku:** `/decks`
- **Główny cel:** Prezentacja listy istniejących zestawów fiszek z możliwością wyszukiwania, sortowania i paginacji.
- **Kluczowe informacje:** Lista decków (zestawów fiszek) z nazwą i datami, opcje wyszukiwania, sortowania, paginacji, przycisk tworzenia nowego zestawu.
- **Kluczowe komponenty:** Lista elementów, wyszukiwarka, kontrolki sortowania, paginacja.
- **UX, dostępność i bezpieczeństwo:** Przejrzysty interfejs umożliwiający szybkie odnalezienie odpowiedniego zestawu, wskaźniki stanu i prostota interakcji.

### Ekran szczegółów/edycji fiszki
- **Ścieżka widoku:** `/decks/{deckId}/flashcard/{flashcardId}`
- **Główny cel:** Pozwolenie na podgląd i edycję szczegółów wybranej fiszki.
- **Kluczowe informacje:** Dane fiszki (przód, tył), informacje o źródle (manual / ai-full / ai-edited), status walidacji.
- **Kluczowe komponenty:** Formularz edycji z polami tekstowymi (inline walidacja), przyciski zapisu, przycisk anulowania, komunikaty o błędach.
- **UX, dostępność i bezpieczeństwo:** Interfejs z natychmiastową walidacją danych, minimalizacja błędów użytkownika, jasne komunikaty zwrotne oraz zabezpieczenia przed utratą danych.

### Modal onboardingowy
- **Ścieżka widoku:** Modal dostępny we wszystkich widokach (pokazywany przy pierwszym wejściu)
- **Główny cel:** Przedstawienie podstawowych instrukcji i funkcji aplikacji dla nowego użytkownika.
- **Kluczowe informacje:** Krótkie wprowadzenie do korzystania z aplikacji, lista kluczowych funkcji, przycisk "Zrozumiałem" lub zamknięcie.
- **Kluczowe komponenty:** Modal z treścią on-boardingu, przycisk do zamknięcia, zapis statusu (np. w profilu użytkownika).
- **UX, dostępność i bezpieczeństwo:** Łatwy do zrozumienia przekaz, responsywny design, możliwość łatwego pominięcia, brak przeszkadzania przy kolejnym użyciu.

### Widok sesji nauki
- **Ścieżka widoku:** `/study`
- **Główny cel:** Umożliwienie użytkownikowi rozpoczęcia sesji nauki, prezentacja fiszek do powtórek.
- **Kluczowe informacje:** Treść fiszki (przód jako pierwsza, potem tył po interakcji), opcje oceny stopnia zapamiętania.
- **Kluczowe komponenty:** Wyświetlacz fiszek, przyciski do odsłonięcia tyłu fiszki, przyciski oceny trudności, nawigacja między fiszkami.
- **UX, dostępność i bezpieczeństwo:** Intuicyjna interakcja, minimalizacja stresu poznawczego, przejrzysty design, zgodność z WCAG.

## 3. Mapa podróży użytkownika

1. Użytkownik wchodzi na stronę (`/login`) i loguje się/rejestruje za pomocą email.
2. Po pomyślnym zalogowaniu użytkownik trafia do dashboardu (`/dashboard`), gdzie widzi podsumowanie swoich zestawów fiszek i dostęp do głównych funkcji.
3. Użytkownik przechodzi do widoku listy zestawów fiszek (`/decks`), gdzie może wyszukać, sortować lub utworzyć nowy zestaw.
4. Po wybraniu zestawu, użytkownik ma możliwość zarządzania fiszkami – przeglądanie listy fiszek i wybór konkretnej fiszki do podglądu/edycji (`/decks/{deckId}/flashcard/{flashcardId}`).
5. Użytkownik może edytować wybraną fiszkę, korzystając z inline walidacji, aby szybko zapisać zmiany.
6. W przypadku nowego użytkownika, modal onboardingowy pojawia się na dashboardzie, aby przedstawić kluczowe funkcje.
7. Użytkownik może rozpocząć sesję nauki, przechodząc do widoku sesji (`/study`) i interaktywnie powtarzać fiszki.
8. Topbar umożliwia szybkie przejście do profilu lub wylogowanie się, a breadcrumbs ułatwiają nawigację po głębszych ścieżkach aplikacji.

## 4. Układ i struktura nawigacji

- **Topbar:** Umieszczony na górze ekranu (poza ekranem logowania). Zawiera nazwę serwisu po lewej stronie i menu profilu z opcją log out po prawej stronie.
- **Breadcrumbs:** Widoczne na wszystkich widokach oprócz ekranu logowania/rejestracji oraz listy zestawów fiszek, umożliwiające łatwą orientację w hierarchii strony.
- **Sidebar (opcjonalnie):** Może być wykorzystany w dashboardzie lub widoku sesji nauki, aby zapewnić szybki dostęp do najczęściej używanych funkcji.
- **Główne menu:** Elementy nawigacji umieszczone w dashboardzie lub topbarze, umożliwiające przejście między widokami (lista zestawów, sesja nauki, profil).

## 5. Kluczowe komponenty

- **Topbar:** Centralny element nawigacyjny zawierający nazwę serwisu i menu profilu.
- **Breadcrumbs:** Ułatwiające śledzenie ścieżki użytkownika w aplikacji.
- **Lista fiszek:** Komponenty wyświetlające zestawy fiszek z funkcjami wyszukiwania, sortowania i paginacji.
- **Formularze:** Komponenty do logowania, rejestracji i edycji fiszek z inline walidacją.
- **Modal:** Komponent wykorzystywany do wyświetlania onboardingu oraz komunikatów.
- **Komponent wyświetlacza fiszek:** Przygotowany do prezentacji fiszek w sesji nauki z opcją odsłaniania tyłu i oceniania.
- **Kontrolki stanu ładowania i błędów:** Zapewniające informację o aktualnym stanie systemu, błędach czy operacjach sieciowych. 