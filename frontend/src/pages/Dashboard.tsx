import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Config, type Log, type DbConnection } from "../lib/api";
import { Edit, Trash2, Database } from "lucide-react";

export default function Dashboard() {
    const [configs, setConfigs] = useState<Config[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [connections, setConnections] = useState<Map<number, DbConnection>>(new Map());
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [page]);

    const loadData = async () => {
        const [configsData, logsResponse, connectionsData] = await Promise.all([
            api.getConfigs(),
            api.getLogs(page),
            api.getConnections()
        ]);

        if (Array.isArray(configsData)) setConfigs(configsData);
        if (logsResponse && logsResponse.data) {
            setLogs(logsResponse.data);
            setTotalPages(logsResponse.pagination.totalPages);
        }

        if (Array.isArray(connectionsData)) {
            const connMap = new Map();
            connectionsData.forEach(c => connMap.set(c.id, c));
            setConnections(connMap);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure?")) {
            await api.deleteConfig(id);
            loadData();
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Query Configurations</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {configs.map((config) => {
                        const conn = connections.get(config.dbConnectionId);
                        return (
                            <div key={config.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{config.name}</h3>
                                    <span className={`px-2 py-1 rounded text-xs ${config.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-300'}`}>
                                        {config.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                    <Database size={14} />
                                    <span>{conn ? conn.name : 'Unknown Connection'}</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-2 font-mono text-xs">Cron: {config.scheduleCron}</p>
                                <div className="flex gap-2 mt-4">
                                    <Link to={`/configs/${config.id}`} className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30">
                                        <Edit size={16} />
                                    </Link>
                                    <button onClick={() => handleDelete(config.id)} className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Recent Logs</h2>
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Config ID</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Result/Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-t border-gray-700">
                                    <td className="p-3 text-gray-400">{new Date(log.executedAt).toLocaleString()}</td>
                                    <td className="p-3">{log.configId}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <textarea
                                            readOnly
                                            className="w-full h-24 bg-gray-900 border border-gray-700 rounded p-2 text-xs font-mono text-gray-300 resize-y focus:outline-none focus:border-blue-500"
                                            value={log.status === 'success' ? log.resultSummary : log.errorDetails || ''}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
