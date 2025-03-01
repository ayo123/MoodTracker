// Mock user data for development
export const mockUsers = [
  { id: 1, email: 'test@example.com', password: 'password', name: 'Test User' },
  { id: 2, email: 'admin@example.com', password: 'admin123', name: 'Admin User' },
];

// Mock login function
export const mockLogin = (email: string, password: string) => {
  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );
  
  if (user) {
    return {
      token: 'mock-jwt-token-' + user.id,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
  
  throw new Error('Invalid credentials');
};

// Mock register function
export const mockRegister = (email: string, password: string) => {
  const existingUser = mockUsers.find((u) => u.email === email);
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const newId = Math.max(...mockUsers.map((u) => u.id)) + 1;
  const newUser = { id: newId, email, password, name: email.split('@')[0] };
  
  return {
    token: 'mock-jwt-token-' + newId,
    user: { id: newUser.id, email: newUser.email, name: newUser.name },
  };
}; 