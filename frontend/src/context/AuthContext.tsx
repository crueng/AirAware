import { createContext, useState, useContext} from "react";
import type { ReactNode } from "react";
import { Endpoints } from "../apiConfig";

interface User {
  username: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  user: User | null; 
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("jwt_token"),
  );
  
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("username");
    return savedUser ? { username: savedUser } : null;
  });

  const isLoggedIn = !!token;

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(Endpoints.Login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => response.text());
        const receivedToken =
          typeof data === "string" ? data : data.token || data.accessToken;

        if (receivedToken) {
          setToken(receivedToken);
          setUser({ username });
          
          localStorage.setItem("jwt_token", receivedToken);
          localStorage.setItem("username", username); 
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Login Fehler:", error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null); 
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("username");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error(
      "useAuth muss innerhalb eines AuthProviders verwendet werden",
    );
  }
  return authContext;
};