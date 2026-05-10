const fs = require('fs');
const path = require('path');

/**
 * Security Logger Middleware
 * Logs security-related events to file and console
 */

const LOG_DIR = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Get log file path based on log type
 */
function getLogPath(logType = 'security') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(LOG_DIR, `${logType}_${date}.log`);
}

/**
 * Format log entry
 */
function formatLogEntry(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const metadataStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `[${timestamp}] [${level}] ${message} ${metadataStr}`.trim();
}

/**
 * Write to log file
 */
function writeLog(logType, level, message, metadata = {}) {
    const logPath = getLogPath(logType);
    const entry = formatLogEntry(level, message, metadata);
    
    try {
        fs.appendFileSync(logPath, entry + '\n', 'utf8');
    } catch (err) {
        console.error('⚠️  Failed to write to log file:', err.message);
    }
}

/**
 * Logger utility object
 */
const logger = {
    security: {
        login(success, email, ip, metadata = {}) {
            const message = `LOGIN_ATTEMPT: ${success ? 'SUCCESS' : 'FAILED'} | email=${email}`;
            writeLog('security', success ? 'INFO' : 'WARN', message, { ip, ...metadata });
            console.log(`🔐 ${message} (${ip})`);
        },
        
        bruteForce(email, ip, reason, metadata = {}) {
            const message = `BRUTE_FORCE_BLOCKED: ${reason} | email=${email}`;
            writeLog('security', 'WARN', message, { ip, ...metadata });
            console.warn(`🚨 ${message} (${ip})`);
        },
        
        unauthorized(endpoint, reason, ip = 'unknown', metadata = {}) {
            const message = `UNAUTHORIZED_ACCESS: ${endpoint} | reason=${reason}`;
            writeLog('security', 'WARN', message, { ip, ...metadata });
            console.warn(`⚠️  ${message}`);
        },
        
        rateLimitExceeded(endpoint, ip, metadata = {}) {
            const message = `RATE_LIMIT_EXCEEDED: ${endpoint}`;
            writeLog('security', 'WARN', message, { ip, ...metadata });
            console.warn(`⛔ ${message} (${ip})`);
        },
        
        passwordChange(userId, success, ip, metadata = {}) {
            const message = `PASSWORD_CHANGE: ${success ? 'SUCCESS' : 'FAILED'} | userId=${userId}`;
            writeLog('security', 'INFO', message, { ip, ...metadata });
            console.log(`🔑 ${message}`);
        },
        
        roleChange(userId, newRole, changedBy, metadata = {}) {
            const message = `ROLE_CHANGED: userId=${userId} -> ${newRole} | changedBy=${changedBy}`;
            writeLog('security', 'WARN', message, { ...metadata });
            console.warn(`👤 ${message}`);
        }
    },
    
    error: {
        server(message, error, metadata = {}) {
            const errorStr = error?.message || String(error);
            writeLog('error', 'ERROR', message, { error: errorStr, ...metadata });
            console.error(`❌ ${message}: ${errorStr}`);
        },
        
        validation(message, details, metadata = {}) {
            writeLog('error', 'WARN', message, { details, ...metadata });
            console.warn(`⚠️  ${message}`);
        }
    },
    
    audit: {
        action(action, userId, resource, metadata = {}) {
            const message = `AUDIT: ${action} | user=${userId} | resource=${resource}`;
            writeLog('audit', 'INFO', message, { ...metadata });
            console.log(`📋 ${message}`);
        }
    }
};

/**
 * Express middleware to log HTTP errors
 */
function errorLoggingMiddleware(err, req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    logger.error.server(`HTTP Error: ${req.method} ${req.path}`, err, {
        ip,
        userId: req.user?.id || 'anonymous',
        statusCode: err.statusCode || 500
    });
    
    // Pass to next error handler
    next(err);
}

/**
 * Get security logs for monitoring
 */
function getSecurityLogs(days = 1) {
    const logs = [];
    const logPath = getLogPath('security');
    
    try {
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            // Return last N lines
            const limit = 1000;
            return lines.slice(-limit);
        }
    } catch (err) {
        console.error('Failed to read security logs:', err.message);
    }
    
    return logs;
}

/**
 * Get statistics from logs
 */
function getLogStatistics(days = 1) {
    const logs = getSecurityLogs(days);
    const stats = {
        total: logs.length,
        loginAttempts: 0,
        loginSuccess: 0,
        loginFailed: 0,
        bruteForceBlocked: 0,
        unauthorizedAttempts: 0,
        rateLimitExceeded: 0,
        passwordChanges: 0,
        roleChanges: 0
    };
    
    logs.forEach(log => {
        if (log.includes('LOGIN_ATTEMPT: SUCCESS')) stats.loginSuccess++;
        if (log.includes('LOGIN_ATTEMPT: FAILED')) stats.loginFailed++;
        if (log.includes('BRUTE_FORCE_BLOCKED')) stats.bruteForceBlocked++;
        if (log.includes('UNAUTHORIZED_ACCESS')) stats.unauthorizedAttempts++;
        if (log.includes('RATE_LIMIT_EXCEEDED')) stats.rateLimitExceeded++;
        if (log.includes('PASSWORD_CHANGE: SUCCESS')) stats.passwordChanges++;
        if (log.includes('ROLE_CHANGED')) stats.roleChanges++;
    });
    
    stats.loginAttempts = stats.loginSuccess + stats.loginFailed;
    
    return stats;
}

module.exports = {
    logger,
    errorLoggingMiddleware,
    getSecurityLogs,
    getLogStatistics,
    writeLog
};
