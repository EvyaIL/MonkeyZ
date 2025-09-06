/**
 * User Model and Types
 * Defines user-related data structures and utilities
 */

// User roles enum (for TypeScript compatibility)
export const Role = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

// User roles configuration
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
  GUEST: 'guest'
};

// User permissions
export const USER_PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  MODERATE: 'moderate'
};

// User status
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

// User model class
export class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || '';
    this.username = data.username || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.role = data.role || USER_ROLES.USER;
    this.status = data.status || USER_STATUS.ACTIVE;
    this.permissions = data.permissions || [USER_PERMISSIONS.READ];
    this.avatar = data.avatar || null;
    this.phone = data.phone || '';
    this.address = data.address || {};
    this.preferences = data.preferences || {};
    this.metadata = {
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      lastLoginAt: data.lastLoginAt || null,
      loginCount: data.loginCount || 0,
      ...data.metadata
    };
  }
  
  // Get full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim() || this.username || this.email;
  }
  
  // Get display name
  getDisplayName() {
    return this.username || this.getFullName() || this.email;
  }
  
  // Check if user has specific role
  hasRole(role) {
    return this.role === role;
  }
  
  // Check if user has specific permission
  hasPermission(permission) {
    // Admin users have all permissions
    if (this.role === USER_ROLES.ADMIN) {
      return true;
    }
    
    return this.permissions.includes(permission);
  }
  
  // Check if user is active
  isActive() {
    return this.status === USER_STATUS.ACTIVE;
  }
  
  // Check if user can perform action
  canPerform(action) {
    if (!this.isActive()) {
      return false;
    }
    
    const actionPermissions = {
      'read': [USER_PERMISSIONS.READ],
      'create': [USER_PERMISSIONS.WRITE],
      'update': [USER_PERMISSIONS.WRITE],
      'delete': [USER_PERMISSIONS.DELETE],
      'moderate': [USER_PERMISSIONS.MODERATE],
      'admin': [USER_PERMISSIONS.ADMIN]
    };
    
    const requiredPermissions = actionPermissions[action] || [];
    return requiredPermissions.some(permission => this.hasPermission(permission));
  }
  
  // Update user data
  update(data) {
    Object.assign(this, data);
    this.metadata.updatedAt = new Date().toISOString();
    return this;
  }
  
  // Record login
  recordLogin() {
    this.metadata.lastLoginAt = new Date().toISOString();
    this.metadata.loginCount = (this.metadata.loginCount || 0) + 1;
    this.metadata.updatedAt = new Date().toISOString();
    return this;
  }
  
  // Convert to plain object
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      status: this.status,
      permissions: this.permissions,
      avatar: this.avatar,
      phone: this.phone,
      address: this.address,
      preferences: this.preferences,
      metadata: this.metadata
    };
  }
  
  // Convert to public object (safe for frontend)
  toPublicJSON() {
    return {
      id: this.id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      role: this.role,
      status: this.status,
      metadata: {
        createdAt: this.metadata.createdAt,
        lastLoginAt: this.metadata.lastLoginAt
      }
    };
  }
}

// User factory functions
export const createUser = (data) => new User(data);

export const createGuestUser = () => new User({
  role: USER_ROLES.GUEST,
  status: USER_STATUS.ACTIVE,
  permissions: [USER_PERMISSIONS.READ]
});

export const createAdminUser = (data) => new User({
  ...data,
  role: USER_ROLES.ADMIN,
  permissions: Object.values(USER_PERMISSIONS)
});

// User validation utilities
export const validateUser = (userData) => {
  const errors = [];
  
  if (!userData.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  if (!userData.username && !userData.firstName && !userData.lastName) {
    errors.push('Username or name is required');
  }
  
  if (userData.role && !Object.values(USER_ROLES).includes(userData.role)) {
    errors.push('Invalid user role');
  }
  
  if (userData.status && !Object.values(USER_STATUS).includes(userData.status)) {
    errors.push('Invalid user status');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// User search and filtering utilities
export class UserManager {
  constructor(users = []) {
    this.users = users.map(userData => userData instanceof User ? userData : new User(userData));
  }
  
  // Add user
  addUser(userData) {
    const user = userData instanceof User ? userData : new User(userData);
    this.users.push(user);
    return user;
  }
  
  // Find user by ID
  findById(id) {
    return this.users.find(user => user.id === id) || null;
  }
  
  // Find user by email
  findByEmail(email) {
    return this.users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }
  
  // Find user by username
  findByUsername(username) {
    return this.users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  }
  
  // Filter users
  filter(criteria) {
    return this.users.filter(user => {
      for (const [key, value] of Object.entries(criteria)) {
        if (user[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
  
  // Search users
  search(query) {
    const searchTerm = query.toLowerCase();
    
    return this.users.filter(user => 
      user.email.toLowerCase().includes(searchTerm) ||
      user.username.toLowerCase().includes(searchTerm) ||
      user.firstName.toLowerCase().includes(searchTerm) ||
      user.lastName.toLowerCase().includes(searchTerm)
    );
  }
  
  // Get users by role
  getUsersByRole(role) {
    return this.users.filter(user => user.role === role);
  }
  
  // Get active users
  getActiveUsers() {
    return this.users.filter(user => user.isActive());
  }
  
  // Get user statistics
  getStats() {
    const totalUsers = this.users.length;
    const activeUsers = this.getActiveUsers().length;
    const usersByRole = {};
    const usersByStatus = {};
    
    // Count by role
    for (const role of Object.values(USER_ROLES)) {
      usersByRole[role] = this.getUsersByRole(role).length;
    }
    
    // Count by status
    for (const status of Object.values(USER_STATUS)) {
      usersByStatus[status] = this.users.filter(user => user.status === status).length;
    }
    
    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = this.users.filter(user => 
      new Date(user.metadata.createdAt) > thirtyDaysAgo
    ).length;
    
    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: usersByRole,
      byStatus: usersByStatus,
      recentSignups
    };
  }
  
  // Export users
  export(format = 'json') {
    const data = this.users.map(user => user.toJSON());
    
    switch (format) {
      case 'csv':
        return this.exportToCsv(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }
  
  // Export to CSV
  exportToCsv(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).filter(key => key !== 'metadata' && key !== 'preferences');
    const csvRows = [
      headers.join(','),
      ...data.map(user => 
        headers.map(header => {
          const value = user[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }
}

// React hooks for user management
export const useUser = (userId) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    // In a real app, this would fetch from an API
    setTimeout(() => {
      const mockUser = new User({
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: USER_ROLES.USER
      });
      
      setUser(mockUser);
      setLoading(false);
    }, 500);
  }, [userId]);
  
  return { user, loading, error };
};

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // In a real app, this would check authentication and fetch current user
    setTimeout(() => {
      const mockUser = new User({
        id: 'current-user',
        email: 'current@example.com',
        username: 'currentuser',
        firstName: 'Jane',
        lastName: 'Smith',
        role: USER_ROLES.USER
      });
      
      setCurrentUser(mockUser);
      setLoading(false);
    }, 300);
  }, []);
  
  const login = (userData) => {
    const user = new User(userData);
    user.recordLogin();
    setCurrentUser(user);
    return user;
  };
  
  const logout = () => {
    setCurrentUser(null);
  };
  
  const updateProfile = (data) => {
    if (currentUser) {
      currentUser.update(data);
      setCurrentUser(new User(currentUser.toJSON()));
    }
  };
  
  return {
    user: currentUser,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.hasRole(USER_ROLES.ADMIN) || false
  };
};

// Default export
export default User;
