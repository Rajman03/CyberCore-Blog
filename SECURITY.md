# 🛡️ Bezpieczeństwo - Poradnik Implementacji

## Przegląd Poprawek Bezpieczeństwa

### ✅ Zaimplementowane Zabezpieczenia

#### 1. **CORS (Cross-Origin Resource Sharing)**
- ❌ **Problem**: Poprzednia konfiguracja `origin: true` pozwalała na dostęp z dowolnego Origin
- ✅ **Rozwiązanie**: Domyślnie ustawione na `['http://localhost:3000', 'http://localhost:4823']`
- 📝 **Konfiguracja**: Edytuj `ALLOWED_ORIGINS` w `.env`
  ```env
  ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com,https://app.yourdomain.com
  ```

#### 2. **Content Security Policy (CSP)**
- ❌ **Problem**: `unsafe-inline` w scriptSrc umożliwiał XSS ataki
- ✅ **Rozwiązanie**: Usunięte `unsafe-inline`, ścieżki CSS/JS zoptymalizowane
- 📝 **Wymaga**: Wartości `nonce` w inline stylach/skryptach (jeśli potrzebne)

#### 3. **HTTPS Enforcement (Production)**
- ✅ **Dodane**: Automatyczne przekierowanie HTTP → HTTPS w produkcji
- 📝 **Jak**: Ustawienie `NODE_ENV=production`
- 🔒 **HSTS**: maxAge 1 rok, includeSubDomains=true

#### 4. **Clickjacking Protection**
- ✅ **X-Frame-Options**: `DENY` (brak iframe'owania)
- ✅ **X-Content-Type-Options**: `nosniff`

#### 5. **Rate Limiting**
- ❌ **Problem**: Limit 1000 żądań/15min był zbyt permisywny
- ✅ **Poprawki**:
  - Globalny limit: **100 żądań/15min**
  - Login/Register: **10 żądań/15min**
  - Password Reset: **5 żądań/godzinę**
- 📝 **Per-IP**: Rate limit liczy się na podstawie IP użytkownika

#### 6. **API Token Security**
- ❌ **Problem**: `/me` endpoint zwracał `api_token`
- ✅ **Rozwiązanie**: Token nie jest zwracany w odpowiedzi
- 📝 **Dostęp do tokena**: Ukryty w bazie, dostępny tylko wewnętrznie

#### 7. **Paginacja**
- ❌ **Problem**: Endpointy zwracały wszystkie wiersze (DoS risk)
- ✅ **Poprawki**: LIMIT + OFFSET na:
  - `GET /api/posts` (limit 20, max 50)
  - `GET /api/paywall/articles` (limit 20, max 50)
  - `GET /api/users` (limit 50, max 100)
  - `GET /api/posts/:id/comments` (limit 20, max 100)

#### 8. **Webhook Stripe**
- ⚠️ **Status**: Wymaga konfiguracji
- 📝 **TODO**: Zainstaluj `stripe` i skonfiguruj:
  ```javascript
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  ```

#### 9. **CSRF Protection**
- 📌 **Status**: REST API z tokenami (Authorization header) jest naturalnie chroniony przed CSRF
- ⚠️ **Jeśli dodasz form-based flows**: Zainstaluj `express-session` i `csrf` do ochrony
- 💡 **Format**: POST/PUT/PATCH/DELETE powinny wysyłać `X-CSRF-Token` header

#### 10. **Password Security**
- ✅ **Argon2id**: Hashing z typem ID
- ✅ **Walidacja**: Min 8 znaków, 1 wielka litera, 1 mała litera, 1 cyfra
- ✅ **Lista zagrożonych**: Blokada 100+ najpopularniejszych haseł

---

## 🔐 Checklist Bezpieczeństwa dla Produkcji

### Configuration
- [ ] Ustawiłem `NODE_ENV=production`
- [ ] Wygenerowałem silny `SECRET_KEY` (min 32 znaki)
- [ ] Skonfigurował(em) `ALLOWED_ORIGINS` z konkretnymi domenami
- [ ] Instalowalem i skonfigurowalem Stripe (jeśli paywall aktywny)
- [ ] Ustawilem `STRIPE_WEBHOOK_SECRET`

### Database
- [ ] Backup bazy danych
- [ ] Włączylem WAL mode (Write-Ahead Logging) dla SQLite
- [ ] Testowałem restore z backupu

### SSL/TLS
- [ ] Mam ważny certyfikat SSL
- [ ] HSTS header jest aktywny
- [ ] Przekierowanie HTTP → HTTPS funkcjonuje

### Monitoring
- [ ] Logi błędów są zbierane do pliku/serwisu
- [ ] Monitoruję rate limiting alerts
- [ ] Sprawdzam login_attempts tabeli pod kątem podejrzanych patternów

### Environment Variables
```bash
# .env production
NODE_ENV=production
PORT=4823
SECRET_KEY=your-very-long-random-secret-key-min-32-chars
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📋 Znane Ograniczenia

1. **SQLite**: Brak built-in backup'ów. Dodaj cron job manualne backup'u
2. **Sessions**: W-memory tracker dla IP. Restart serwera = reset
3. **CSRF**: Aktualnie nie implementowany (wymagany dla form-based flows)
4. **Email**: Brak weryfikacji adresu email
5. **2FA**: Nie implementowana

### Uwaga na temat Supabase

Jeśli używasz **Supabase** zamiast SQLite:
- ✅ Automatyczne daily backups
- ✅ Row Level Security (RLS)
- ✅ Real-time database
- ⚠️ Upewnij się, że polityki RLS są prawidłowo skonfigurowane
- 📝 Czytaj [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) dla szczegółów konfiguracji

---

## 🚀 Dalsze Ulepszen

### Priorytet 1
- [ ] Implementacja CSRF protection
- [ ] Email verification na /register
- [ ] Persistent session storage (Redis lub DB)
- [ ] Rate limiting z persistent storage

### Priorytet 2
- [ ] 2FA (TOTP)
- [ ] API Key rotation
- [ ] Account activity logging
- [ ] Breach detection alerts

### Priorytet 3
- [ ] OAuth2/OpenID Connect
- [ ] Data encryption at rest
- [ ] Automated security scans (npm audit, OWASP)
- [ ] Penetration testing

---

## 📞 Kontakt Bezpieczeństwa

Jeśli znalazłeś lukę, Zaraportuj
