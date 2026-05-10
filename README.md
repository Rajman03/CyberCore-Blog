# 🛡️ SECURE.BLOG
> **Advanced Cyber Security Lab** – Nowoczesna platforma blogowa z naciskiem na bezpieczeństwo, kryptografię i modularną architekturę SPA.

---

## 🌟 Główne Atuty Projektu

### 🔒 Bezpieczeństwo (Security-First)
*   **Kryptografia:** Hasła haszowane algorytmem `Argon2id` (zwycięzca Password Hashing Competition).
*   **Sesje:** Bezpieczne zarządzanie sesjami w bazie SQLite z flagami `HttpOnly` i `SameSite`.
*   **Ochrona API:** Restrykcyjne polityki `CSP` (Content Security Policy) oraz nagłówki `Helmet`.
*   **Walidacja Danych:** Ścisła weryfikacja wejścia za pomocą biblioteki `Joi`.
*   **Sanityzacja XSS:** Middleware `sanitize-html` oczyszczający `req.body`, `req.query` i `req.params`.
*   **Ochrona HPP:** Middleware `hpp` blokujący HTTP Parameter Pollution.
*   **Monitoring:** Logowanie zapytań `Morgan` oraz limitowanie żądań `express-rate-limit`.
*   **Anti-Bypass Paywall:** Nagłówki `no-store`, `X-Robots-Tag: noarchive` blokujące 12ft.io i cache robotów. Treść Premium nigdy nie opuszcza serwera bez autoryzacji.

### ⚡ Architektura (Modular SPA)
*   **Single Page Application:** Architektura SPA z dynamicznym routerem i ładowaniem widoków HTML.
*   **Kontrolery Widoków:** Logika podzielona na pliki `controllers/` (home, admin, paywall, auth, profile).
*   **Core API:** Biblioteka frontendowa `core.js` do obsługi zapytań HTTP i obsługi błędów.
*   **Modular Backend:** Przejrzysty podział na Routes, Middleware i Config.
*   **Responsywny UI/UX:** Pełna obsługa Desktop / Tablet / Mobile z animacjami CSS.
*   **Wydajność:** Node.js, Express i lokalna baza SQLite3.

---

## 🛠️ Szybki Start

### Instalacja
1.  Pobierz zależności:
    ```bash
    npm install
    ```
2.  Uruchom serwer (auto-reload):
    ```bash
    npm run dev
    ```
3.  Otwórz w przeglądarce: `http://localhost:4823`

---

## 📂 Struktura Projektu

```text
├── 📄 server.js              # Główny serwer Express
├── 📂 config/                # Konfiguracja bazy danych (SQLite)
├── 📂 middleware/            # Autoryzacja, walidacja Joi, zabezpieczenia
├── 📂 routes/                # API Endpoints (Auth, Posts, Comments, Users, Paywall)
├── 📂 db/                    # Pliki bazy danych SQLite
├── 📂 scripts/               # Skrypty migracyjne i narzędziowe
├── 📂 public/
│   ├── 📄 index.html         # Punkt wejścia SPA
│   ├── 📂 css/
│   │   ├── main.css          # Style główne + responsywność
│   │   ├── admin.css         # Style panelu administracyjnego
│   │   └── paywall.css       # Style strefy Premium i modali
│   ├── 📂 js/
│   │   ├── core.js           # Biblioteka API (fetch wrapper)
│   │   ├── app.js            # Router SPA + sesja + nawigacja
│   │   └── 📂 controllers/
│   │       ├── home.js       # Strona główna, posty, komentarze
│   │       ├── admin.js      # Panel zarządzania (posty, użytkownicy, role)
│   │       ├── paywall.js    # Strefa Premium, Stripe, subskrypcje
│   │       ├── auth.js       # Logowanie i rejestracja
│   │       └── profile.js    # Profil użytkownika, zmiana hasła
│   └── 📂 views/
│       ├── home.html         # Widok strony głównej
│       ├── admin.html        # Widok panelu admina
│       ├── paywall.html      # Widok strefy Premium
│       ├── login.html        # Widok logowania
│       ├── register.html     # Widok rejestracji
│       └── profile.html      # Widok profilu
```

---

## 🚀 Status Rozwoju
- [x] Architektura SPA z dynamicznym routerem i kontrolerami widoków
- [x] Modularny kod JS podzielony na `controllers/` (łatwy w edycji)
- [x] Zaawansowane zabezpieczenia (CSP, Helmet, Joi, Argon2id, HPP, XSS Sanitize)
- [x] System uwierzytelniania oparty na ciasteczkach `HttpOnly`
- [x] Paywall Premium z symulacją Stripe Checkout (gotowy na produkcję)
- [x] Ochrona przed bypass paywall (12ft.io, Google Cache, Reader Mode)
- [x] Responsywny interfejs UI/UX (Desktop, Tablet, Mobile)
- [x] Premium Glassmorphism Design z mikro-animacjami
- [x] Panel Administracyjny z zarządzaniem postami, rolami i użytkownikami

---
*Zaprojektowana i stworzona przez Rajman03*
