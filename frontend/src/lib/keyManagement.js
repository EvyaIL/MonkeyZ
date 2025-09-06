/**
 * Key Management Utilities
 * Handles API key generation, validation, and management
 */

import { v4 as uuidv4 } from 'uuid';

// Key Types and permissions - Define before using them
export const KEY_TYPES = {
  ADMIN: 'admin',
  USER: 'user',
  READONLY: 'readonly',
  API: 'api',
  STANDARD: 'standard'
};

export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin'
};

// Utility functions for key parsing and validation
export const parseKeysFromText = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const USER_PERMISSIONS_READ = 'read';
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map(line => {
      const parts = line.split(',').map(part => part.trim());
      return {
        id: parts[0] || `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: parts[1] || 'Imported Key',
        type: parts[2] || KEY_TYPES.STANDARD,
        permissions: parts[3] ? parts[3].split('|') : [USER_PERMISSIONS_READ],
        rateLimit: parseInt(parts[4]) || 1000,
        valid: true
      };
    });
};

export const validateKeyFormat = (keyString) => {
  if (!keyString || typeof keyString !== 'string') {
    return { valid: false, error: 'Key string is required' };
  }
  
  // Basic key format validation
  const keyPattern = /^[A-Za-z0-9_-]+$/;
  if (!keyPattern.test(keyString)) {
    return { valid: false, error: 'Invalid key format. Use only alphanumeric characters, underscores, and hyphens.' };
  }
  
  if (keyString.length < 8) {
    return { valid: false, error: 'Key must be at least 8 characters long' };
  }
  
  if (keyString.length > 128) {
    return { valid: false, error: 'Key must be less than 128 characters long' };
  }
  
  return { valid: true };
};

// Key management class
export class KeyManager {
  constructor() {
    this.keys = new Map();
    this.keyHistory = [];
    this.rateLimit = new Map();
  }
  
  // Generate a new API key
  generateKey(type = KEY_TYPES.USER, permissions = [PERMISSIONS.READ], metadata = {}) {
    const keyId = uuidv4();
    const keySecret = this.generateSecretKey();
    const timestamp = Date.now();
    
    const keyData = {
      id: keyId,
      secret: keySecret,
      type,
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      metadata: {
        ...metadata,
        createdAt: timestamp,
        lastUsed: null,
        usageCount: 0
      },
      active: true,
      expiresAt: metadata.expiresAt || null
    };
    
    this.keys.set(keyId, keyData);
    
    // Log key creation
    this.keyHistory.push({
      action: 'created',
      keyId,
      timestamp,
      metadata
    });
    
    return {
      keyId,
      keySecret,
      type,
      permissions
    };
  }
  
  // Generate a secure secret key
  generateSecretKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `mk_${result}`;
  }
  
  // Validate an API key
  validateKey(keyId, keySecret) {
    const keyData = this.keys.get(keyId);
    
    if (!keyData) {
      return { valid: false, error: 'Key not found' };
    }
    
    if (!keyData.active) {
      return { valid: false, error: 'Key is inactive' };
    }
    
    if (keyData.expiresAt && Date.now() > keyData.expiresAt) {
      return { valid: false, error: 'Key has expired' };
    }
    
    if (keyData.secret !== keySecret) {
      return { valid: false, error: 'Invalid key secret' };
    }
    
    // Update usage statistics
    keyData.metadata.lastUsed = Date.now();
    keyData.metadata.usageCount++;
    
    return {
      valid: true,
      keyData: {
        id: keyData.id,
        type: keyData.type,
        permissions: keyData.permissions,
        metadata: keyData.metadata
      }
    };
  }
  
  // Check if key has specific permission
  hasPermission(keyId, permission) {
    const keyData = this.keys.get(keyId);
    
    if (!keyData || !keyData.active) {
      return false;
    }
    
    // Admin keys have all permissions
    if (keyData.type === KEY_TYPES.ADMIN) {
      return true;
    }
    
    return keyData.permissions.includes(permission);
  }
  
  // Rate limiting
  checkRateLimit(keyId, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.rateLimit.has(keyId)) {
      this.rateLimit.set(keyId, []);
    }
    
    const requests = this.rateLimit.get(keyId);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    this.rateLimit.set(keyId, recentRequests);
    
    if (recentRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + windowMs
      };
    }
    
    // Add current request
    recentRequests.push(now);
    
    return {
      allowed: true,
      remaining: limit - recentRequests.length,
      resetTime: windowStart + windowMs
    };
  }
  
  // Revoke a key
  revokeKey(keyId, reason = 'Manual revocation') {
    const keyData = this.keys.get(keyId);
    
    if (!keyData) {
      return { success: false, error: 'Key not found' };
    }
    
    keyData.active = false;
    keyData.metadata.revokedAt = Date.now();
    keyData.metadata.revocationReason = reason;
    
    // Log revocation
    this.keyHistory.push({
      action: 'revoked',
      keyId,
      timestamp: Date.now(),
      reason
    });
    
    return { success: true };
  }
  
  // Get key information
  getKeyInfo(keyId) {
    const keyData = this.keys.get(keyId);
    
    if (!keyData) {
      return null;
    }
    
    return {
      id: keyData.id,
      type: keyData.type,
      permissions: keyData.permissions,
      active: keyData.active,
      metadata: keyData.metadata
    };
  }
  
  // List all keys (admin only)
  listKeys(includeInactive = false) {
    const keyList = [];
    
    for (const [keyId, keyData] of this.keys) {
      if (!includeInactive && !keyData.active) {
        continue;
      }
      
      keyList.push({
        id: keyData.id,
        type: keyData.type,
        permissions: keyData.permissions,
        active: keyData.active,
        metadata: {
          createdAt: keyData.metadata.createdAt,
          lastUsed: keyData.metadata.lastUsed,
          usageCount: keyData.metadata.usageCount,
          revokedAt: keyData.metadata.revokedAt,
          revocationReason: keyData.metadata.revocationReason
        }
      });
    }
    
    return keyList.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
  }
  
  // Get usage statistics
  getUsageStats() {
    const totalKeys = this.keys.size;
    const activeKeys = Array.from(this.keys.values()).filter(key => key.active).length;
    const keysByType = {};
    const recentUsage = [];
    
    for (const keyData of this.keys.values()) {
      // Count by type
      keysByType[keyData.type] = (keysByType[keyData.type] || 0) + 1;
      
      // Recent usage (last 24 hours)
      if (keyData.metadata.lastUsed && 
          Date.now() - keyData.metadata.lastUsed < 24 * 60 * 60 * 1000) {
        recentUsage.push({
          keyId: keyData.id,
          type: keyData.type,
          lastUsed: keyData.metadata.lastUsed,
          usageCount: keyData.metadata.usageCount
        });
      }
    }
    
    return {
      totalKeys,
      activeKeys,
      keysByType,
      recentUsage: recentUsage.sort((a, b) => b.lastUsed - a.lastUsed),
      history: this.keyHistory.slice(-50) // Last 50 actions
    };
  }
  
  // Bulk operations
  bulkRevoke(keyIds, reason = 'Bulk revocation') {
    const results = [];
    
    for (const keyId of keyIds) {
      const result = this.revokeKey(keyId, reason);
      results.push({ keyId, ...result });
    }
    
    return results;
  }
  
  bulkGenerate(count, type = KEY_TYPES.USER, permissions = [PERMISSIONS.READ]) {
    const keys = [];
    
    for (let i = 0; i < count; i++) {
      const key = this.generateKey(type, permissions, {
        batchGenerated: true,
        batchIndex: i
      });
      keys.push(key);
    }
    
    return keys;
  }
  
  // Export/Import functionality
  exportKeys(includeSecrets = false) {
    const exported = [];
    
    for (const keyData of this.keys.values()) {
      const exportData = {
        id: keyData.id,
        type: keyData.type,
        permissions: keyData.permissions,
        active: keyData.active,
        metadata: keyData.metadata
      };
      
      if (includeSecrets) {
        exportData.secret = keyData.secret;
      }
      
      exported.push(exportData);
    }
    
    return {
      keys: exported,
      exportedAt: Date.now(),
      includesSecrets: includeSecrets
    };
  }
  
  importKeys(data, overwrite = false) {
    let imported = 0;
    let skipped = 0;
    
    for (const keyData of data.keys) {
      if (this.keys.has(keyData.id) && !overwrite) {
        skipped++;
        continue;
      }
      
      this.keys.set(keyData.id, keyData);
      imported++;
    }
    
    return { imported, skipped };
  }
}

// Global key manager instance
export const keyManager = new KeyManager();

// Utility functions
export const generateApiKey = (type, permissions, metadata) => 
  keyManager.generateKey(type, permissions, metadata);

export const validateApiKey = (keyId, keySecret) => 
  keyManager.validateKey(keyId, keySecret);

export const checkKeyPermission = (keyId, permission) => 
  keyManager.hasPermission(keyId, permission);

export const revokeApiKey = (keyId, reason) => 
  keyManager.revokeKey(keyId, reason);

export const getKeyUsageStats = () => 
  keyManager.getUsageStats();

// React hooks for key management
export const useApiKey = (keyId) => {
  const [keyInfo, setKeyInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!keyId) {
      setKeyInfo(null);
      setLoading(false);
      return;
    }
    
    const info = keyManager.getKeyInfo(keyId);
    setKeyInfo(info);
    setLoading(false);
  }, [keyId]);
  
  return { keyInfo, loading };
};

export const useKeyList = (includeInactive = false) => {
  const [keys, setKeys] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const keyList = keyManager.listKeys(includeInactive);
    setKeys(keyList);
    setLoading(false);
  }, [includeInactive]);
  
  const refresh = () => {
    const keyList = keyManager.listKeys(includeInactive);
    setKeys(keyList);
  };
  
  return { keys, loading, refresh };
};

export default keyManager;
