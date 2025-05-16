<mermaid_diagram>
```mermaid
stateDiagram-v2
    direction LR
    [*] --> StronaPowitalna

    state "Niezalogowany Użytkownik" as Niezalogowany {
        StronaPowitalna: Użytkownik widzi opcje Logowania i Rejestracji
        note right of StronaPowitalna
            Główne akcje:
            - Zaloguj się
            - Zarejestruj się
            - Zapomniałem hasła
        end note
        StronaPowitalna --> DoRejestracji: Kliknięcie "Zarejestruj się"
        StronaPowitalna --> DoLogowania: Kliknięcie "Zaloguj się"
        StronaPowitalna --> DoOdzyskiwaniaHasla: Kliknięcie "Zapomniałem hasła"
    }

    state "Proces Rejestracji (US-005)" as Rejestracja {
        direction LR
        DoRejestracji --> FormularzRejestracji
        FormularzRejestracji: Wprowadź email i hasło
        FormularzRejestracji --> WalidacjaDanychRejestracji: Prześlij formularz
        WalidacjaDanychRejestracji --> if_dane_rejestracji_poprawne <<choice>>
        if_dane_rejestracji_poprawne --> UtworzenieKonta: Dane poprawne
        if_dane_rejestracji_poprawne --> FormularzRejestracji: Błąd walidacji (np. email zajęty)
        note left of FormularzRejestracji
            Walidacja obejmuje:
            - Format email
            - Siłę hasła
            - Unikalność email
        end note
        UtworzenieKonta: System tworzy konto (Supabase)
        UtworzenieKonta --> EmailWeryfikacyjnyWyslany
        EmailWeryfikacyjnyWyslany: Informacja o wysłaniu maila
        EmailWeryfikacyjnyWyslany --> OczekiwanieNaWeryfikacjeEmail
        OczekiwanieNaWeryfikacjeEmail: Sprawdź skrzynkę email i kliknij link
        OczekiwanieNaWeryfikacjeEmail --> WeryfikacjaTokenaEmail: Użytkownik klika link
        WeryfikacjaTokenaEmail --> if_token_email_poprawny <<choice>>
        if_token_email_poprawny --> KontoAktywowane: Token poprawny
        KontoAktywowane: Konto pomyślnie aktywowane
        KontoAktywowane --> PrzekierowaniePoRejestracji
        if_token_email_poprawny --> OczekiwanieNaWeryfikacjeEmail: Token niepoprawny/wygasł
        PrzekierowaniePoRejestracji --> DoLogowania
        note right of PrzekierowaniePoRejestracji
            Użytkownik może zostać
            automatycznie zalogowany
            lub przekierowany do logowania.
            Przyjęto przekierowanie do logowania.
        end note
    }

    state "Proces Logowania (US-005)" as Logowanie {
        direction LR
        DoLogowania --> FormularzLogowania
        FormularzLogowania: Wprowadź email i hasło
        FormularzLogowania --> Autentykacja: Prześlij formularz
        Autentykacja: Weryfikacja poświadczeń (Supabase)
        Autentykacja --> if_autentykacja_udana <<choice>>
        if_autentykacja_udana --> LogowanieUdane: Poświadczenia poprawne
        LogowanieUdane --> PanelUzytkownika
        if_autentykacja_udana --> BladLogowania: Niepoprawne poświadczenia
        BladLogowania: Komunikat o błędzie
        BladLogowania --> FormularzLogowania
    }

    state "Panel Użytkownika (Zalogowany)" as Panel {
        direction LR
        PanelUzytkownika: Dostęp do funkcji aplikacji
        note left of PanelUzytkownika
            Główne funkcje:
            - Zarządzanie fiszkami (US-002, US-003, US-004)
            - Zarządzanie zestawami (US-007)
            - Onboarding (US-001)
            - Ustawienia konta (domniemane)
        end note
        PanelUzytkownika --> DoWylogowania: Kliknięcie "Wyloguj"
        DoWylogowania --> Wylogowany
        Wylogowany --> StronaPowitalna
    }

    state "Proces Odzyskiwania Hasła" as OdzyskiwanieHasla {
        direction LR
        DoOdzyskiwaniaHasla --> FormularzProsbyOReset
        FormularzProsbyOReset: Wprowadź email
        FormularzProsbyOReset --> WeryfikacjaEmailDoResetu: Prześlij
        WeryfikacjaEmailDoResetu --> if_email_istnieje_do_resetu <<choice>>
        if_email_istnieje_do_resetu --> EmailZLinkiemResetujacymWyslany: Email istnieje
        EmailZLinkiemResetujacymWyslany: Informacja o wysłaniu linku
        EmailZLinkiemResetujacymWyslany --> OczekiwanieNaKlikniecieWLink
        if_email_istnieje_do_resetu --> BladEmailNieIstnieje: Email nie istnieje
        BladEmailNieIstnieje: Komunikat o błędzie
        BladEmailNieIstnieje --> FormularzProsbyOReset

        OczekiwanieNaKlikniecieWLink: Użytkownik klika link w emailu
        OczekiwanieNaKlikniecieWLink --> FormularzNowegoHasla
        FormularzNowegoHasla: Wprowadź nowe hasło i potwierdź
        FormularzNowegoHasla --> WalidacjaNowegoHasla: Prześlij
        WalidacjaNowegoHasla --> if_nowe_haslo_poprawne <<choice>>
        if_nowe_haslo_poprawne --> HasloZmienione: Hasło poprawne
        HasloZmienione: Informacja o zmianie hasła
        HasloZmienione --> DoLogowania
        if_nowe_haslo_poprawne --> FormularzNowegoHasla: Błąd walidacji (np. hasła niezgodne)
    }
    PanelUzytkownika --> [*]
```
</mermaid_diagram> 