import { CronJob } from "cron";
import { db } from "./db";
import { queryConfigs, queryLogs, dbConnections, notificationLogs } from "./db/schema";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";

// Keep track of running jobs
const jobs: Map<number, { job: CronJob, schedule: string }> = new Map();
let isRefreshing = false;

export async function startScheduler() {
    console.log("Starting scheduler...");
    try {
        await refreshJobs();
    } catch (e) {
        console.error("Initial job refresh failed (DB might not be ready):", e);
    }

    // Refresh jobs every 10 seconds to pick up changes faster
    const timeZone = process.env.TZ || "Asia/Bangkok";
    console.log(`Starting scheduler with timezone: ${timeZone}`);

    new CronJob("*/10 * * * * *", async () => {
        try {
            await refreshJobs();
        } catch (e) {
            console.error("Scheduled job refresh failed:", e);
        }
    }, null, true, timeZone);
}

async function refreshJobs() {
    if (isRefreshing) {
        console.log("Skipping refreshJobs (already running)");
        return;
    }
    isRefreshing = true;

    try {
        // Fetch all active configs
        const configs = await db.select().from(queryConfigs).where(eq(queryConfigs.isActive, true));
        const activeConfigIds = new Set(configs.map(c => c.id));

        // 1. Remove jobs that are no longer active or deleted
        for (const [id, data] of jobs) {
            if (!activeConfigIds.has(id)) {
                console.log(`Stopping job for config ${id}`);
                data.job.stop();
                jobs.delete(id);
            }
        }

        // 2. Add or update jobs
        for (const config of configs) {
            const existing = jobs.get(config.id);

            if (existing) {
                if (existing.schedule === config.scheduleCron) {
                    // Schedule hasn't changed, skip
                    continue;
                } else {
                    // Schedule changed, restart
                    console.log(`Updating job for config ${config.id} (Schedule changed)`);
                    existing.job.stop();
                    jobs.delete(config.id);
                }
            }

            try {
                console.log(`Starting job for config ${config.id} with schedule ${config.scheduleCron}`);
                const timeZone = process.env.TZ || "Asia/Bangkok";
                const job = new CronJob(config.scheduleCron, async () => {
                    await executeQuery(config);
                }, null, true, timeZone);
                // job.start(); // start is already called by the 4th argument 'true'
                jobs.set(config.id, { job, schedule: config.scheduleCron });
            } catch (e) {
                console.error(`Failed to schedule job for config ${config.id}:`, e);
            }
        }
        console.log(`Active jobs: ${jobs.size}`);
    } finally {
        isRefreshing = false;
    }
}

async function executeQuery(config: typeof queryConfigs.$inferSelect) {
    console.log(`Executing query for config ${config.name}`);
    let status = "success";
    let resultSummary = "";
    let errorDetails = "";

    try {
        // Get connection details
        const connectionConfig = await db.select().from(dbConnections).where(eq(dbConnections.id, config.dbConnectionId)).limit(1);

        if (!connectionConfig.length) {
            throw new Error(`Connection ID ${config.dbConnectionId} not found`);
        }

        const connDetails = connectionConfig[0];

        // Connect to target DB
        const connection = await mysql.createConnection(connDetails.connectionString);
        const [results] = await connection.execute(config.sqlQuery);
        await connection.end();

        // Format result
        let message = "";
        if (config.resultTemplate && Array.isArray(results) && results.length > 0) {
            const header = `✅ **${config.name}**\n`;
            const footerTemplate = "\n... (+{{count}} more items)";
            const maxLen = 2000 - header.length;

            let currentMessage = "";
            let includedCount = 0;

            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                const formattedRow = config.resultTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                    return row[key] !== undefined ? String(row[key]) : `{{${key}}}`;
                });

                // Check if adding this row + potential footer exceeds limit
                // We estimate footer length based on remaining items (worst case 3 digits)
                const remaining = results.length - i - 1;
                const footer = remaining > 0 ? footerTemplate.replace("{{count}}", String(remaining)) : "";

                // Add newline if not first item
                const separator = i > 0 ? "\n" : "";

                if ((currentMessage.length + separator.length + formattedRow.length + footer.length) <= maxLen) {
                    currentMessage += separator + formattedRow;
                    includedCount++;
                } else {
                    // Stop here
                    currentMessage += footerTemplate.replace("{{count}}", String(results.length - includedCount));
                    break;
                }
            }
            message = currentMessage;
        } else {
            message = JSON.stringify(results).slice(0, 2000);
        }

        // Log success (removed duplicate insert here)
        resultSummary = message.slice(0, 255);

        // Send Notifications
        if (config.notifyDiscordWebhook) {
            try {
                // Reserve some space for the header "✅ **Name**\n"
                const header = `✅ **${config.name}**\n`;

                const response = await fetch(config.notifyDiscordWebhook, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: header + message }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Discord API error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                await logNotification(config.id, 'discord', 'success', 'Notification sent');
            } catch (e: any) {
                console.error("Discord notification failed:", e);
                await logNotification(config.id, 'discord', 'error', e.message);
            }
        }

        // Telegram notification implementation would go here

    } catch (e: any) {
        status = "error";
        errorDetails = e.message;
        console.error(`Error executing query ${config.name}:`, e);

        if (config.notifyDiscordWebhook) {
            try {
                await fetch(config.notifyDiscordWebhook, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: `Query **${config.name}** failed.\nError: \`${e.message}\`` }),
                });
                await logNotification(config.id, 'discord', 'success', 'Error notification sent');
            } catch (notifyErr: any) {
                console.error("Discord error notification failed:", notifyErr);
                await logNotification(config.id, 'discord', 'error', notifyErr.message);
            }
        }
    }

    await db.insert(queryLogs).values({
        configId: config.id,
        status,
        resultSummary,
        errorDetails,
    });
}

async function logNotification(configId: number, type: string, status: string, message: string) {
    try {
        await db.insert(notificationLogs).values({
            configId,
            type,
            status,
            message
        });
    } catch (e) {
        console.error("Failed to log notification:", e);
    }
}
