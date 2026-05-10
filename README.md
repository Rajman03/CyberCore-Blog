# 🛡️ SECURE.BLOG
> **Advanced Cyber Security Lab** – Nowoczesna platforma blogowa z naciskiem na bezpieczeństwo, kryptografię i modularną architekturę.

---

## 🌟 Główne Atuty Projektu

### 🔒 Bezpieczeństwo (Security-First)
*   **Kryptografia:** Hasła haszowane algorytmem `Argon2id` (zwycięzca Password Hashing Competition).
*   **Sesje:** Bezpieczne zarządzanie sesjami w bazie SQLite z flagami `HttpOnly` i `SameSite`.
*   **Ochrona API:** Restrykcyjne polityki `CSP` (Content Security Policy) oraz nagłówki `Helmet`.
*   **Walidacja Danych:** Ścisła weryfikacja wejścia za pomocą biblioteki `Joi`.
*   **Ochrona ID & XSS:** Wykorzystanie `UUID v4` zamiast sekwencyjnych ID, pełna filtracja XSS (biblioteka `xss`).
*   **Monitoring:** Zaawansowane logowanie zapytań przy użyciu `Morgan` oraz limitowanie żądań (`express-rate-limit`).

### ⚡ Architektura (Modular & API-Driven)
*   **Pure Frontend:** Architektura oparta na czystym HTML/JS/CSS z asynchroniczną komunikacją API (Fetch).
*   **Core API:** Dedykowana biblioteka frontendowa (`core.js`) do zunifikowanej obsługi zapytań i błędów.
*   **Modular Backend:** Przejrzysty podział na kontrolery (Routes), modele (DB) i middleware zabezpieczające.
*   **Wydajność:** Oparty na Node.js, Express i lokalnej bazie SQLite3 dla maksymalnej optymalizacji.

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

---

## 📂 Struktura Projektu (Clean Architecture)

```text
├── 📂 config/          # Konfiguracja bazy danych (SQLite)
├── 📂 middleware/      # Logika autoryzacji, walidacji (Joi) i zabezpieczeń
├── 📂 routes/          # API Endpoints (Auth, Posts, Comments, Users)
├── 📂 public/          # Zasoby statyczne (HTML, CSS, JS)
├── 📂 db/              # Baza danych SQLite i dane sesyjne
└── 📄 server.js        # Główny orchestrator aplikacji
```

---

## 🚀 Status Rozwoju
- [x] Odejście od EJS na rzecz architektury API-Driven (Pure HTML/JS Frontend)
- [x] Wdrożenie zaawansowanych mechanizmów bezpieczeństwa (CSP, Morgan, Helmet, Joi)
- [x] Solidny system uwierzytelniania oparty na ciasteczkach (HttpOnly) i Argon2id
- [x] Modułowa struktura backendu z centralną biblioteką `core.js`
- [x] Nowoczesny interfejs UI/UX (Premium Glassmorphism & ujednolicony system przycisków)
- [x] Interaktywny Landing Page z dynamicznym Hero Section

---
*Zaprojektowana i stworzona przez Rajman03*
