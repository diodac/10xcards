# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

Projekt 10xCards to aplikacja webowa umożliwiająca tworzenie fiszek edukacyjnych przy wykorzystaniu technologii AI oraz manualnie przez użytkownika. Aplikacja łączy możliwość bulkowego generowania fiszek z interfejsem umożliwiającym ich przeglądanie, edycję (w tym dodawanie komentarzy) oraz usuwanie. System opiera się na prostym mechanizmie zarządzania kontami użytkowników, wykorzystującym Supabase, oraz integracji z gotowym algorytmem powtórek opartym o spaced repetition. Dodatkowo, aplikacja rejestruje logi dotyczące źródła pochodzenia fiszek i procesu ich generowania, co pozwoli na analizę kosztów i wykorzystania w przyszłości.

## 2. Problem użytkownika

Użytkownicy często rezygnują z ręcznego tworzenia wysokiej jakości fiszek edukacyjnych ze względu na duże nakłady czasowe i wysiłek, co ogranicza efektywność nauki przy wykorzystaniu metody spaced repetition. Problem ten jest szczególnie dotkliwy w sytuacjach, gdy potrzebne są szybkie i efektywne materiały do nauki, a manualne ich tworzenie staje się barierą dla systematycznego podchodzenia do nauki.

## 3. Wymagania funkcjonalne

1. Generowanie fiszek przez AI:
   - Umożliwienie wprowadzenia tekstu (kopiuj-wklej) w celu bulkowego generowania fiszek.
   - Prezentacja wygenerowanych fiszek z możliwością indywidualnej edycji, w tym dodania komentarzy.
   - Zapewnienie możliwości zatwierdzania lub modyfikacji wygenerowanych fiszek bez opcji resetowania ich treści.

2. Manualne tworzenie fiszek:
   - Możliwość tworzenia, edycji i usuwania fiszek przez użytkownika.

3. Przeglądanie fiszek:
   - Wyświetlanie listy fiszek umożliwiającej łatwy dostęp do edycji i usuwania.

4. System kont użytkowników:
   - Implementacja podstawowego systemu rejestracji i logowania wykorzystującego Supabase.
   - Zapewnienie bezpiecznego dostępu do danych użytkownika.

5. Integracja z algorytmem powtórek:
   - Wykorzystanie gotowego algorytmu spaced repetition do integracji z fiszkami.

6. Onboarding:
   - Wyświetlenie modala z instrukcjami przy pierwszym uruchomieniu aplikacji.
   - Możliwość ponownego otwarcia modala z poziomu interfejsu.

7. Logowanie zdarzeń:
   - Rejestrowanie logów dotyczących generowania fiszek, w tym źródła i kosztów generacji, dla celów analitycznych.

## 4. Granice produktu

1. Nie obejmuje zaawansowanego algorytmu powtórek (np. SuperMemo, Anki) – wykorzystany zostanie istniejący, podstawowy mechanizm.
2. Brak obsługi importu z wielu formatów (PDF, DOCX itp.).
3. Brak funkcjonalności współdzielenia zestawów fiszek między użytkownikami.
4. Brak integracji z innymi platformami edukacyjnymi.
5. Aplikacja mobilna nie jest w zakresie MVP – produkt będzie dostępny tylko jako aplikacja webowa.

## 5. Historyjki użytkowników

### US-001: Onboarding
- ID: US-001
- Tytuł: Wyświetlenie modala onboardingowego
- Opis: Jako nowy użytkownik chcę zobaczyć modal z instrukcjami przy pierwszym uruchomieniu, aby szybko zapoznać się z funkcjonalnościami aplikacji.
- Kryteria akceptacji:
  - Modal pojawia się automatycznie przy pierwszym uruchomieniu.
  - Użytkownik ma możliwość ponownego otwarcia modala z menu aplikacji.

### US-002: Generowanie fiszek przez AI
- ID: US-002
- Tytuł: Bulkowe generowanie fiszek przez AI
- Opis: Jako użytkownik chcę wprowadzić tekst i wygenerować fiszki przy użyciu AI, aby szybko otrzymać zestaw materiałów do nauki.
- Kryteria akceptacji:
  - Po wprowadzeniu tekstu i zatwierdzeniu, system generuje zestaw fiszek.
  - Użytkownik może edytować, dodawać komentarze i zatwierdzić poszczególne fiszki.
  - Użytkownik ma możliwość ponownego wygenerowania danej fiszki, przy czym system wykorzysta oryginalną treść oraz dodany komentarz użytkownika, aby wygenerować zmodyfikowaną wersję fiszki.

### US-003: Manualne tworzenie fiszek
- ID: US-003
- Tytuł: Ręczne tworzenie fiszek
- Opis: Jako użytkownik chcę móc ręcznie tworzyć fiszki, aby dodawać te, które nie wymagają generowania przez AI.
- Kryteria akceptacji:
  - Użytkownik może tworzyć, edytować i usuwać fiszki w interfejsie.

### US-004: Przeglądanie i edycja fiszek
- ID: US-004
- Tytuł: Zarządzanie fiszkami
- Opis: Jako użytkownik chcę przeglądać, edytować i usuwać fiszki, aby móc zarządzać swoim materiałem do nauki.
- Kryteria akceptacji:
  - System wyświetla listę fiszek.
  - Każda fiszka posiada opcje edycji i usunięcia.

### US-005: Bezpieczny dostęp do konta
- ID: US-005
- Tytuł: Rejestracja i logowanie
- Opis: Jako użytkownik chcę móc zarejestrować się i zalogować, aby móc bezpiecznie przechowywać i zarządzać swoim zestawem fiszek.
- Kryteria akceptacji:
  - Użytkownik może założyć konto i zalogować się przy użyciu podstawowej implementacji Supabase.
  - Dane użytkownika są bezpiecznie przechowywane.

### US-006: Logowanie zdarzeń generacji
- ID: US-006
- Tytuł: Rejestrowanie danych generacji
- Opis: Jako administrator chcę, aby system logował zdarzenia związane z generowaniem fiszek, w tym informacje o źródle i kosztach, aby móc analizować efektywność wykorzystania AI.
- Kryteria akceptacji:
  - Każde zdarzenie generacji jest rejestrowane w bazie danych.
  - Logi zawierają informacje o źródle oraz koszcie generacji fiszek.

### US-007: Zarządzanie zestawami fiszek
- ID: US-007
- Tytuł: Tworzenie i zarządzanie zestawami fiszek
- Opis: Jako użytkownik chcę móc tworzyć zestawy fiszek z dowolną nazwą, aby organizować materiały według tematów bez konieczności przypisywania kategorii.
- Kryteria akceptacji:
  - Użytkownik może tworzyć zestawy fiszek o dowolnej nazwie.
  - W obrębie zestawu możliwe jest bulkowe generowanie fiszek oraz indywidualna edycja każdej fiszki.

## 6. Metryki sukcesu

1. Co najmniej 75% fiszek generowanych przez AI musi być akceptowanych przez użytkownika.
2. Użytkownicy powinni tworzyć przynajmniej 75% fiszek przy użyciu funkcji AI.
3. System musi umożliwiać monitorowanie kosztów generacji przypisanych do każdego użytkownika.
4. Pozytywna reakcja na intuicyjny onboarding oraz efektywne zarządzanie kontem użytkownika.
5. Rejestrowanie i analiza logów generacji fiszek umożliwiająca przyszłe rozszerzenie funkcjonalności analitycznych. 