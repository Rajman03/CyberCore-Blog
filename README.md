# 🛡️ SECURE.BLOG
> **Advanced Cyber Security Lab** – Nowoczesna platforma blogowa z naciskiem na bezpieczeństwo, kryptografię i modularną architekturę.

---

## 🌟 Główne Atuty Projektu

### 🔒 Bezpieczeństwo (Security-First)
*   **Kryptografia:** Hasła haszowane algorytmem `Argon2id` (zwycięzca Password Hashing Competition).
*   **Sesje:** Bezpieczne zarządzanie sesjami w bazie SQLite z flagami `HttpOnly` i `SameSite`.
*   **Ochrona ID:** Wykorzystanie `UUID v4` zamiast numerów ID, co uniemożliwia wycieki danych (IDOR).
*   **Ochrona XSS:** Pełna filtracja treści komentarzy przy użyciu biblioteki `xss`.

### ⚡ Architektura (Modular & Clean)
*   **MVC Pattern:** Przejrzysty podział na modele (DB), widoki (EJS) i kontrolery (Routes).
*   **Master Layout:** Scentralizowany system szablonów (`express-ejs-layouts`) dla spójnego designu.
*   **Core Library:** Dedykowana biblioteka `core.js` do zunifikowanej obsługi API i błędów.
*   **Fullstack Node.js:** Wydajny backend oparty na Express i SQLite3.

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
├── 📂 config/          # Konfiguracja bazy danych i silnika
├── 📂 middleware/      # Logika autoryzacji i zabezpieczeń
├── 📂 routes/          # Moduły API (Auth, Posts, Comments, Users)
├── 📂 views/           # Szablony EJS i Layouty
├── 📂 public/          # Zasoby statyczne (CSS, Core API JS)
├── 📂 db/              # Baza danych SQLite
└── 📄 server.js        # Główny orchestrator aplikacji
```

---

## 🚀 Status Rozwoju
- [x] Nowoczesny system szablonów EJS
- [x] Modułowa architektura backendu
- [x] System komentarzy z filtrowaniem XSS

---
*Zaprojektowana i stworzona przez Rajman03*
