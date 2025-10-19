import { createContext, useContext } from 'react';
import type { User, Child } from '../types';

interface AuthContextType {
  user: User | null;
  activeChild: Child | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setActiveChild: (child: Child) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  activeChild: null,
  login: async () => false,
  logout: () => {},
  setActiveChild: () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};
