export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  username: string;
  role: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  role: string;
  enabled?: boolean;
}

export interface UserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}
