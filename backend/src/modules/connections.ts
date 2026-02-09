import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { dbConnections } from "../db/schema";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";

export const connections = new Elysia()
    .use(
        jwt({
            name: "jwt",
            secret: process.env.JWT_SECRET!,
        })
    )
    .derive(async ({ jwt, headers }) => {
        const auth = headers["authorization"];
        if (!auth?.startsWith("Bearer ")) return { user: null };
        const token = auth.slice(7);
        const user = await jwt.verify(token);
        return { user };
    })
    .onBeforeHandle(({ user, set }) => {
        if (!user) {
            set.status = 401;
            return "Unauthorized";
        }
    })
    .post("/connections/test", async ({ body }) => {
        const { connectionString, type } = body;
        try {
            if (type === 'mysql') {
                const conn = await mysql.createConnection(connectionString);
                await conn.end();
                return { success: true, message: "Connection successful" };
            }
            // Add postgres support later if needed
            return { success: false, error: "Unsupported database type" };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            connectionString: t.String(),
            type: t.String()
        })
    })
    .get("/connections", async () => {
        return await db.select().from(dbConnections);
    })
    .post(
        "/connections",
        async ({ body }) => {
            const result = await db.insert(dbConnections).values(body);
            return { success: true, id: result[0].insertId };
        },
        {
            body: t.Object({
                name: t.String(),
                type: t.String(),
                connectionString: t.String(),
                isActive: t.Boolean(),
            }),
        }
    )
    .put(
        "/connections/:id",
        async ({ params: { id }, body }) => {
            await db.update(dbConnections).set(body).where(eq(dbConnections.id, parseInt(id)));
            return { success: true };
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                type: t.Optional(t.String()),
                connectionString: t.Optional(t.String()),
                isActive: t.Optional(t.Boolean()),
            }),
        }
    )
    .delete("/connections/:id", async ({ params: { id } }) => {
        await db.delete(dbConnections).where(eq(dbConnections.id, parseInt(id)));
        return { success: true };
    });
