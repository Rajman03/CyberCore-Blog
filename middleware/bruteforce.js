/**
 * Brute Force & Dictionary Attack Protection Middleware
 * 
 * Warstwa ochrony:
 * 1. Rate limiting per IP na endpointy auth
 * 2. Progresywna blokada IP (czas rośnie wykładniczo)
 * 3. Logowanie wszystkich prób w tabeli login_attempts
 * 4. Lista zbanowanych haseł (top 1000 najczęściej łamanych)
 */

const { db } = require('../config/db');

// --- Konfiguracja ---
const CONFIG = {
    maxAttemptsPerIP: 10,        // Max prób z jednego IP w oknie czasowym
    maxAttemptsPerUser: 5,       // Max prób na jedno konto (już masz to w auth.js)
    windowMs: 15 * 60 * 1000,   // Okno czasowe: 15 minut
    baseLockoutMs: 5 * 60 * 1000,  // Bazowa blokada: 5 minut
    maxLockoutMs: 60 * 60 * 1000,  // Max blokada: 1 godzina
    lockoutMultiplier: 2,        // Mnożnik progresywny
    cleanupIntervalMs: 30 * 60 * 1000, // Czyszczenie starych wpisów co 30 min
};

// --- In-Memory IP tracker (szybki dostęp) ---
const ipAttempts = new Map();

/**
 * Czyści stare wpisy z mapy IP (garbage collection)
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipAttempts.entries()) {
        // Usuń wpisy, których okno czasowe wygasło i nie mają aktywnej blokady
        if (now > data.windowStart + CONFIG.windowMs && (!data.lockedUntil || now > data.lockedUntil)) {
            ipAttempts.delete(ip);
        }
    }
}, CONFIG.cleanupIntervalMs);


/**
 * Pobiera lub tworzy tracker dla danego IP
 */
function getIPTracker(ip) {
    if (!ipAttempts.has(ip)) {
        ipAttempts.set(ip, {
            attempts: 0,
            windowStart: Date.now(),
            lockedUntil: null,
            lockCount: 0,  // Ile razy IP było blokowane (do progresji)
        });
    }
    
    const tracker = ipAttempts.get(ip);
    
    // Reset okna jeśli wygasło (i nie ma aktywnej blokady)
    if (Date.now() > tracker.windowStart + CONFIG.windowMs && !tracker.lockedUntil) {
        tracker.attempts = 0;
        tracker.windowStart = Date.now();
    }
    
    return tracker;
}

/**
 * Loguje próbę logowania do bazy danych
 */
function logAttempt(ip, email, success, userAgent) {
    db.run(
        `INSERT INTO login_attempts (ip_address, email, success, user_agent, attempted_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [ip, email || 'unknown', success ? 1 : 0, userAgent || 'unknown', Date.now()]
    );
}

/**
 * MIDDLEWARE: Brute Force Guard
 * Sprawdza czy IP nie przekroczyło limitu prób logowania.
 * Montowane PRZED endpointem /login
 */
function bruteForceGuard(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const tracker = getIPTracker(ip);
    const now = Date.now();
    
    // Sprawdź czy IP jest zablokowane
    if (tracker.lockedUntil && now < tracker.lockedUntil) {
        const remainingMs = tracker.lockedUntil - now;
        const remainingMin = Math.ceil(remainingMs / 60000);
        
        // Loguj zablokowaną próbę
        logAttempt(ip, req.body?.email, false, req.headers['user-agent']);
        
        return res.status(429).json({
            error: `🛡️ IP tymczasowo zablokowane. Spróbuj za ${remainingMin} min.`,
            retryAfter: Math.ceil(remainingMs / 1000),
            blocked: true
        });
    }
    
    // Reset blokady jeśli wygasła
    if (tracker.lockedUntil && now >= tracker.lockedUntil) {
        tracker.lockedUntil = null;
        tracker.attempts = 0;
        tracker.windowStart = Date.now();
    }
    
    next();
}

/**
 * Rejestruje nieudaną próbę logowania.
 * Wywoływane z routes/auth.js po nieudanym logowaniu.
 */
function recordFailedAttempt(ip, email, userAgent) {
    const tracker = getIPTracker(ip);
    tracker.attempts++;
    
    logAttempt(ip, email, false, userAgent);
    
    // Sprawdź czy osiągnięto limit prób per IP
    if (tracker.attempts >= CONFIG.maxAttemptsPerIP) {
        tracker.lockCount++;
        // Progresywny lockout: 5min, 10min, 20min, 40min... max 1h
        const lockDuration = Math.min(
            CONFIG.baseLockoutMs * Math.pow(CONFIG.lockoutMultiplier, tracker.lockCount - 1),
            CONFIG.maxLockoutMs
        );
        tracker.lockedUntil = Date.now() + lockDuration;
        
        console.warn(`🚨 [BRUTE-FORCE] IP ${ip} zablokowane na ${lockDuration / 60000} min (próba ${tracker.lockCount})`);
        
        return {
            locked: true,
            lockDuration,
            lockCount: tracker.lockCount
        };
    }
    
    return {
        locked: false,
        attemptsRemaining: CONFIG.maxAttemptsPerIP - tracker.attempts
    };
}

/**
 * Rejestruje udane logowanie — resetuje tracker IP
 */
function recordSuccessfulLogin(ip, email, userAgent) {
    const tracker = getIPTracker(ip);
    tracker.attempts = 0;
    tracker.lockedUntil = null;
    // NIE resetujemy lockCount — historia blokad zostaje
    
    logAttempt(ip, email, true, userAgent);
}

/**
 * Lista 100 najczęściej łamanych haseł.
 * Blokujemy rejestrację z tymi hasłami.
 */
const COMPROMISED_PASSWORDS = new Set([
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
    'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
    'ashley', 'bailey', 'shadow', '123123', '654321', 'superman', 'qazwsx',
    'michael', 'football', 'password1', 'password123', 'batman', 'login',
    'princess', 'admin123', 'welcome', 'solo', 'passw0rd', 'starwars',
    'master123', 'hello', 'charlie', 'donald', 'letmein', '696969',
    'jordan', 'access', 'flower', 'hottie', 'loveme', '7777777',
    'mustang', 'robert', 'hunter', 'thomas', 'abcdef', 'killer',
    'soccer', 'harley', 'george', 'andrew', 'chicken', 'jessica',
    'joshua', 'pepper', 'daniel', 'buster', 'ginger', 'matrix',
    'summer', 'hannah', 'william', 'amanda', 'phoenix', 'jennifer',
    'maggie', 'soccer1', 'orange', 'jasmine', 'test123', 'qwerty123',
    'pass123', 'letmein1', 'hello123', 'freedom', 'cookie', 'whatever',
    'nichols', 'silver', 'thunder', 'corvette', 'computer', 'internet',
    'blahblah', 'bigdog', 'compaq', 'purple', 'sparky', 'cheese',
    'yankees', 'muffin', 'butter', 'merlin', 'albert', 'diamond',
    'hockey', 'dallas', 'ranger', 'samson', 'steelers', 'austin',
    'joseph', 'nicole',
    // Polskie popularne hasła
    'haslo123', 'polska', 'zaq12wsx', 'misiek', 'kochanie', 'dupa',
    'bartek', 'marcin', 'tomek', 'mateusz', 'damian', 'kamil',
    'qweasdzxc', 'ania123', 'kasia123', 'admin1', 'root123', 'test1234'
]);

/**
 * Sprawdza czy hasło jest na liście skompromitowanych
 */
function isPasswordCompromised(password) {
    return COMPROMISED_PASSWORDS.has(password.toLowerCase());
}

/**
 * Zwraca statystyki prób logowania dla admina
 */
function getLoginStats(callback) {
    const queries = {
        totalAttempts: 'SELECT COUNT(*) as count FROM login_attempts WHERE attempted_at > ?',
        failedAttempts: 'SELECT COUNT(*) as count FROM login_attempts WHERE success = 0 AND attempted_at > ?',
        uniqueIPs: 'SELECT COUNT(DISTINCT ip_address) as count FROM login_attempts WHERE success = 0 AND attempted_at > ?',
        topOffenders: `SELECT ip_address, COUNT(*) as attempts 
                       FROM login_attempts 
                       WHERE success = 0 AND attempted_at > ? 
                       GROUP BY ip_address 
                       ORDER BY attempts DESC 
                       LIMIT 10`,
        blockedIPs: null  // Z mapy in-memory
    };
    
    const since = Date.now() - 24 * 60 * 60 * 1000; // Ostatnie 24h
    const stats = {};
    
    db.get(queries.totalAttempts, [since], (err, row) => {
        stats.totalAttempts24h = row?.count || 0;
        
        db.get(queries.failedAttempts, [since], (err, row) => {
            stats.failedAttempts24h = row?.count || 0;
            
            db.get(queries.uniqueIPs, [since], (err, row) => {
                stats.uniqueAttackingIPs = row?.count || 0;
                
                db.all(queries.topOffenders, [since], (err, rows) => {
                    stats.topOffenders = rows || [];
                    
                    // Dodaj aktualnie zablokowane IP
                    const now = Date.now();
                    stats.currentlyBlockedIPs = [];
                    for (const [ip, data] of ipAttempts.entries()) {
                        if (data.lockedUntil && now < data.lockedUntil) {
                            stats.currentlyBlockedIPs.push({
                                ip,
                                lockedUntil: new Date(data.lockedUntil).toISOString(),
                                lockCount: data.lockCount
                            });
                        }
                    }
                    
                    callback(null, stats);
                });
            });
        });
    });
}

module.exports = {
    bruteForceGuard,
    recordFailedAttempt,
    recordSuccessfulLogin,
    isPasswordCompromised,
    getLoginStats,
    CONFIG
};
