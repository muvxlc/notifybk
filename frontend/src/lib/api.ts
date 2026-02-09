const API_URL = import.meta.env.VITE_API_URL || "/api";

export interface DbConnection {
    id: number;
    name: string;
    type: string;
    connectionString: string;
    isActive: boolean;
}

export interface Config {
    id: number;
    name: string;
    sqlQuery: string;
    scheduleCron: string;
    dbConnectionId: number;
    notifyDiscordWebhook?: string;
    notifyTelegramChatId?: string;
    resultTemplate?: string;
    isActive: boolean;
}

export interface Log {
    id: number;
    configId: number;
    executedAt: string;
    status: string;
    resultSummary: string;
    errorDetails: string;
}

export interface NotificationLog {
    id: number;
    configId: number;
    type: string;
    status: string;
    message: string;
    createdAt: string;
}

export const api = {
    async login(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        return res.json();
    },

    async register(username: string, password: string): Promise<{ success: boolean; error?: string }> {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        return res.json();
    },

    // Connections
    async getConnections(): Promise<DbConnection[]> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/connections`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
    },

    async testConnection(data: { connectionString: string; type: string }): Promise<{ success: boolean; message?: string; error?: string }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/connections/test`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async createConnection(data: Omit<DbConnection, "id">): Promise<{ success: boolean }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/connections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async updateConnection(id: string, data: Partial<DbConnection>): Promise<{ success: boolean }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/connections/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async deleteConnection(id: number): Promise<{ success: boolean }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/connections/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
    },

    // Configs
    async getConfigs(): Promise<Config[]> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/configs`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
    },

    async createConfig(data: Omit<Config, "id">): Promise<{ success: boolean }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/configs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async updateConfig(id: string, data: Partial<Config>): Promise<{ success: boolean }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/configs/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async testQuery(data: { sqlQuery: string; dbConnectionId: number }): Promise<{ success: boolean; results?: any[]; error?: string }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/configs/test`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async deleteConfig(id: number): Promise<{ success: boolean }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/configs/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
    },

    // Logs
    async getLogs(page = 1, limit = 20): Promise<{ data: Log[], pagination: { page: number, limit: number, total: number, totalPages: number } }> {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/logs?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
    }
};
