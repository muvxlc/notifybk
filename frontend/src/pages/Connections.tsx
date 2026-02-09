import { useEffect, useState, type FormEvent } from "react";
import { api, type DbConnection } from "../lib/api";
import { Trash2, Database } from "lucide-react";

export default function Connections() {
    const [connections, setConnections] = useState<DbConnection[]>([]);
    const [newConnection, setNewConnection] = useState({
        name: "",
        type: "mysql",
        connectionString: "",
        isActive: true
    });
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        const data = await api.getConnections();
        if (Array.isArray(data)) setConnections(data);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            const res = await api.testConnection({
                connectionString: newConnection.connectionString,
                type: newConnection.type
            });
            if (res.success) {
                setTestStatus({ success: true, message: "Connection successful!" });
            } else {
                setTestStatus({ success: false, message: res.error || "Connection failed" });
            }
        } catch (e) {
            setTestStatus({ success: false, message: "Test failed" });
        } finally {
            setIsTesting(false);
        }
    };

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if (!testStatus?.success) {
            alert("Please test the connection successfully before saving.");
            return;
        }
        await api.createConnection(newConnection);
        setNewConnection({ name: "", type: "mysql", connectionString: "", isActive: true });
        setTestStatus(null);
        loadConnections();
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure?")) {
            await api.deleteConnection(id);
            loadConnections();
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Database Connections</h2>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
                <h3 className="text-xl font-bold mb-4">Add New Connection</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={newConnection.name}
                                onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Production DB"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Type</label>
                            <select
                                value={newConnection.type}
                                onChange={(e) => setNewConnection({ ...newConnection, type: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="mysql">MySQL / MariaDB</option>
                                <option value="postgres">PostgreSQL</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">Connection String</label>
                        <input
                            type="text"
                            value={newConnection.connectionString}
                            onChange={(e) => {
                                setNewConnection({ ...newConnection, connectionString: e.target.value });
                                setTestStatus(null); // Reset test status on change
                            }}
                            className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="mysql://user:pass@host:3306/db"
                            required
                        />
                    </div>

                    {testStatus && (
                        <div className={`p-2 rounded text-sm ${testStatus.success ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                            {testStatus.message}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={isTesting || !newConnection.connectionString}
                            className={`flex-1 py-2 px-4 rounded font-bold transition ${isTesting || !newConnection.connectionString ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
                        >
                            {isTesting ? "Testing..." : "Test Connection"}
                        </button>
                        <button
                            type="submit"
                            disabled={!testStatus?.success}
                            className={`flex-1 py-2 px-4 rounded font-bold transition ${!testStatus?.success ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            Add Connection
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connections.map(conn => (
                    <div key={conn.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="text-blue-400" size={20} />
                                <h3 className="font-bold text-lg">{conn.name}</h3>
                            </div>
                            <div className="text-sm text-gray-400 mb-1">Type: <span className="text-gray-300 uppercase">{conn.type}</span></div>
                            <div className="text-xs text-gray-500 font-mono break-all bg-gray-900 p-2 rounded">
                                {conn.connectionString.replace(/:[^:@]+@/, ':****@')}
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => handleDelete(conn.id)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
