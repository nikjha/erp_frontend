import { createContext } from "react";

export interface CurrentUser {
  id: string;
  username: string;
  employee_name: string;
  email?: string;
  home_tenant?: string | null;
  default_company?: string | null;
}

export interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
