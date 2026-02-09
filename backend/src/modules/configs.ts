import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { queryConfigs, queryLogs, dbConnections } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const configs = new Elysia()
    .use(
        jwt({
            name: "jwt",
            secret: process.env.JWT_SECRET!,
        })
    )
    .derive(async ({ jwt, headers }) => {
        const authHeader = headers["authorization"];
        if (!authHeader) return { user: null };
        const token = authHeader.split(" ")[1];
        const profile = await jwt.verify(token);
        return { user: profile };
    })
    .onBeforeHandle(({ user, set }) => {
        if (!user) {
            set.status = 401;
            return "Unauthorized";
        }
    })
    .get("/configs", async () => {
        return await db.select().from(queryConfigs);
    })
    .post("/configs/test", async ({ body }) => {
        const { sqlQuery, dbConnectionId } = body;

        // 1. Get connection details
        const connection = await db.select().from(dbConnections).where(eq(dbConnections.id, dbConnectionId));
        if (!connection.length) {
            return { success: false, error: "Connection not found" };
        }
        const connDetails = connection[0];

        try {
            let results = [];
            if (connDetails.type === 'mysql') {
                const mysql = await import("mysql2/promise");
                const conn = await mysql.createConnection(connDetails.connectionString);
                // Limit to 5 rows for safety
                const [rows] = await conn.query(`${sqlQuery} LIMIT 5`);
                results = rows as any[];
                await conn.end();
            }
            // Add postgres later

            return { success: true, results };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, {
        body: t.Object({
            sqlQuery: t.String(),
            dbConnectionId: t.Number()
        })
    })
    .post(
        "/configs",
        async ({ body }) => {
            const result = await db.insert(queryConfigs).values(body);
            return { success: true, id: result[0].insertId };
        },
        {
            body: t.Object({
                name: t.String(),
                sqlQuery: t.String(),
                scheduleCron: t.String(),
                dbConnectionId: t.Number(),
                notifyDiscordWebhook: t.Optional(t.String()),
                notifyTelegramChatId: t.Optional(t.String()),
                resultTemplate: t.Optional(t.String()),
                isActive: t.Boolean(),
            }),
        }
    )
    .put(
        "/configs/:id",
        async ({ params: { id }, body }) => {
            await db
                .update(queryConfigs)
                .set(body)
                .where(eq(queryConfigs.id, parseInt(id)));
            return { success: true };
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                sqlQuery: t.Optional(t.String()),
                scheduleCron: t.Optional(t.String()),
                dbConnectionId: t.Optional(t.Number()),
                notifyDiscordWebhook: t.Optional(t.String()),
                notifyTelegramChatId: t.Optional(t.String()),
                resultTemplate: t.Optional(t.String()),
                isActive: t.Optional(t.Boolean()),
            }),
        }
    )
    .delete("/configs/:id", async ({ params: { id } }) => {
        await db.delete(queryConfigs).where(eq(queryConfigs.id, parseInt(id)));
        return { success: true };
    })
    .get("/logs", async ({ query: { page, limit } }) => {
        const pageNum = parseInt(page || "1");
        const limitNum = parseInt(limit || "20");
        const offset = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            db.select().from(queryLogs).orderBy(desc(queryLogs.executedAt)).limit(limitNum).offset(offset),
            db.select({ count: sql<number>`count(*)` }).from(queryLogs)
        ]);

        return {
            data: logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total[0].count,
                totalPages: Math.ceil(total[0].count / limitNum)
            }
        };
    }, {
        query: t.Object({
            page: t.Optional(t.String()),
            limit: t.Optional(t.String())
        })
    });
