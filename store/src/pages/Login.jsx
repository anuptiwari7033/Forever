import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { StoreContext } from "../context/StoreContext";
import { loginStore } from "../services/api";

const Login = () => {
  const { backendUrl, setToken } = useContext(StoreContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginStore(backendUrl, { email, password });
      if (data.success) {
        setToken(data.token);
        toast.success("Welcome back!");
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-center text-green-700 mb-2">
          Velora Minutes Store Panel
        </h1>
        <p className="text-xs text-center text-gray-400 mb-6">
          Login with the email/password your admin gave you when this store was created.
        </p>

        <input
          type="email"
          placeholder="Store login email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 text-sm"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white rounded py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
