import { useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, register as apiRegister } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await apiRegister(email, password);
      }
      const res = await apiLogin(email, password);
      login(res.access_token);
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
      <div className="card">
        <h2>{mode === "login" ? "Log in" : "Register"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <a href="#" onClick={toggleMode}>
            {mode === "login" ? "Register" : "Log in"}
          </a>
        </p>
      </div>
    </div>
  );
}