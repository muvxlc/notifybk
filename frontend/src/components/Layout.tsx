import { Outlet, Link, useNavigate } from "react-router-dom";
import { Plus, LogOut } from "lucide-react";

export default function Layout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            <aside className="w-64 bg-gray-800 p-6 flex flex-col">
                <h1 className="text-2xl font-bold mb-8 text-blue-400">QueryDashboard</h1>
                <nav className="flex-1 space-y-4">
                    <Link to="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</Link>
                    <Link to="/connections" className="block py-2 px-4 rounded hover:bg-gray-700">Connections</Link>
                    <Link to="/configs" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded">
                        <Plus size={20} /> New Query
                    </Link>
                </nav>
                <button onClick={handleLogout} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded text-red-400">
                    <LogOut size={20} /> Logout
                </button>
            </aside>
            <main className="flex-1 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
