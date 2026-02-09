import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isRegistering) {
            const res = await api.register(username, password);
            if (res.success) {
                setIsRegistering(false);
                setError("Registration successful! Please login.");
            } else {
                setError(res.error || "Registration failed");
            }
        } else {
            const res = await api.login(username, password);
            if (res.success && res.token) {
                localStorage.setItem("token", res.token);
                navigate("/dashboard");
            } else {
                setError(res.error || "Login failed");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">
                    {isRegistering ? "Create Account" : "Login"}
                </h1>
                {error && <div className={`p-2 rounded mb-4 text-sm ${error.includes("successful") ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}`}>{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                    >
                        {isRegistering ? "Register" : "Login"}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button
                        onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
                        className="text-sm text-gray-400 hover:text-white underline"
                    >
                        {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    );
}
