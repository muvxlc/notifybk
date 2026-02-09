import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Config, type DbConnection } from "../lib/api";

export default function ConfigEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id || id === 'new';

    const [connections, setConnections] = useState<DbConnection[]>([]);
    const [cronMode, setCronMode] = useState<'simple' | 'advanced'>('simple');
    const [simpleSchedule, setSimpleSchedule] = useState('*/5 * * * * *');

    const [form, setForm] = useState<Omit<Config, "id">>({
        name: "",
        sqlQuery: "",
        scheduleCron: "*/5 * * * * *",
        dbConnectionId: 0,
        notifyDiscordWebhook: "",
        notifyTelegramChatId: "",
        resultTemplate: "",
        isActive: true,
    });

    const [testResults, setTestResults] = useState<any[] | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        loadConnections();
        if (!isNew && id) {
            loadConfig();
        }
    }, [id]);

    const loadConnections = async () => {
        const data = await api.getConnections();
        if (Array.isArray(data)) {
            setConnections(data);
            if (isNew && data.length > 0) {
                setForm(f => ({ ...f, dbConnectionId: data[0].id }));
            }
        }
    };

    const loadConfig = async () => {
        const configs = await api.getConfigs();
        const config = configs.find(c => c.id === parseInt(id!));
        if (config) {
            const { id: _, ...rest } = config;
            setForm(rest);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!form.dbConnectionId) {
            alert("Please select a database connection.");
            return;
        }

        const payload: any = {
            ...form,
            dbConnectionId: Number(form.dbConnectionId)
        };

        // Remove empty optional fields to satisfy backend validation if needed
        if (!payload.notifyDiscordWebhook) delete payload.notifyDiscordWebhook;
        if (!payload.notifyTelegramChatId) delete payload.notifyTelegramChatId;

        if (isNew) {
            await api.createConfig(payload);
        } else {
            await api.updateConfig(id!, payload);
        }
        navigate("/dashboard");
    };

    const handleSimpleScheduleChange = (val: string) => {
        setSimpleSchedule(val);
        setForm({ ...form, scheduleCron: val });
    };

    const handleTestQuery = async () => {
        if (!form.dbConnectionId || !form.sqlQuery) {
            alert("Please select a connection and enter a query.");
            return;
        }
        setIsTesting(true);
        try {
            const res = await api.testQuery({
                sqlQuery: form.sqlQuery,
                dbConnectionId: Number(form.dbConnectionId)
            });
            if (res.success) {
                setTestResults(res.results || []);
            } else {
                alert("Error: " + res.error);
            }
        } catch (e) {
            alert("Test failed");
        } finally {
            setIsTesting(false);
        }
    };

    const getPreview = () => {
        if (!form.resultTemplate || !testResults || testResults.length === 0) return null;
        const row = testResults[0];
        return form.resultTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            return row[key] !== undefined ? String(row[key]) : `{{${key}}}`;
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{isNew ? "New Query" : "Edit Query"}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1">Database Connection</label>
                            <select
                                value={form.dbConnectionId}
                                onChange={(e) => setForm({ ...form, dbConnectionId: parseInt(e.target.value) })}
                                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                required
                            >
                                {connections.map(conn => (
                                    <option key={conn.id} value={conn.id}>{conn.name} ({conn.type})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1">SQL Query</label>
                            <div className="relative">
                                <textarea
                                    value={form.sqlQuery}
                                    onChange={(e) => setForm({ ...form, sqlQuery: e.target.value })}
                                    className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-blue-500 focus:outline-none font-mono h-32"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleTestQuery}
                                    disabled={isTesting}
                                    className="absolute bottom-2 right-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 rounded"
                                >
                                    {isTesting ? "Testing..." : "Test Query"}
                                </button>
                            </div>
                        </div>

                        {testResults && (
                            <div className="bg-gray-900 p-4 rounded border border-gray-700">
                                <h4 className="text-sm font-bold text-gray-400 mb-2">Test Results (First 5 rows)</h4>
                                <pre className="text-xs text-green-400 overflow-auto max-h-40">
                                    {JSON.stringify(testResults, null, 2)}
                                </pre>
                                <div className="mt-2 text-xs text-gray-500">
                                    Available fields: {testResults.length > 0 ? Object.keys(testResults[0]).join(", ") : "None"}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded border border-gray-700">
                            <div className="flex justify-between mb-2">
                                <label className="block text-gray-400">Schedule</label>
                                <div className="text-sm space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setCronMode('simple')}
                                        className={`px-2 py-1 rounded ${cronMode === 'simple' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCronMode('advanced')}
                                        className={`px-2 py-1 rounded ${cronMode === 'advanced' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Advanced
                                    </button>
                                </div>
                            </div>

                            {cronMode === 'simple' ? (
                                <div className="space-y-2">
                                    <select
                                        value={simpleSchedule}
                                        onChange={(e) => handleSimpleScheduleChange(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="*/5 * * * * *">Every 5 seconds (Debug)</option>
                                        <option value="0 * * * * *">Every minute</option>
                                        <option value="0 */5 * * * *">Every 5 minutes</option>
                                        <option value="0 */15 * * * *">Every 15 minutes</option>
                                        <option value="0 */30 * * * *">Every 30 minutes</option>
                                        <option value="0 0 * * * *">Every hour</option>
                                        <option value="daily">Daily at specific time...</option>
                                    </select>

                                    {simpleSchedule === 'daily' && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-gray-400">At:</label>
                                            <input
                                                type="time"
                                                className="bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                                                onChange={(e) => {
                                                    const [h, m] = e.target.value.split(':');
                                                    if (h && m) {
                                                        setForm({ ...form, scheduleCron: `0 ${m} ${h} * * *` });
                                                    }
                                                }}
                                            />
                                            <span className="text-xs text-gray-500">(Cron: {form.scheduleCron})</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={form.scheduleCron}
                                    onChange={(e) => setForm({ ...form, scheduleCron: e.target.value })}
                                    className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none font-mono"
                                    placeholder="* * * * * *"
                                    required
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1">Result Template (Optional)</label>
                            <textarea
                                value={form.resultTemplate || ""}
                                onChange={(e) => setForm({ ...form, resultTemplate: e.target.value })}
                                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-blue-500 focus:outline-none h-24"
                                placeholder="e.g. Total Sales: {{amount}} THB"
                            />
                            <p className="text-xs text-gray-500 mt-1">Use {"{{column_name}}"} to insert values from the first row.</p>

                            {getPreview() && (
                                <div className="mt-2 p-2 bg-gray-700 rounded text-sm text-gray-300">
                                    <span className="font-bold text-gray-500 block text-xs uppercase">Preview:</span>
                                    {getPreview()}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1">Discord Webhook URL</label>
                            <input
                                type="text"
                                value={form.notifyDiscordWebhook || ""}
                                onChange={(e) => setForm({ ...form, notifyDiscordWebhook: e.target.value })}
                                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label className="text-gray-400">Active</label>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={() => navigate("/dashboard")} className="px-4 py-2 text-gray-400 hover:text-white">
                                Cancel
                            </button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
