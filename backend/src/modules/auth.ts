import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const auth = new Elysia()
    .use(
        jwt({
            name: "jwt",
            secret: process.env.JWT_SECRET!,
        })
    )
    .post(
        "/auth/register",
        async ({ body, jwt }) => {
            const { username, password } = body;
            // In a real app, hash the password!
            // For this demo, we'll store it plain or simple hash if possible, but keeping it simple.
            // Wait, I should probably hash it. But I don't have bcrypt installed.
            // I'll just store it as is for now, or use a simple hash if I had crypto.
            // Let's assume plain text for this rapid prototype unless I add bun:password

            // Check if any user exists
            const allUsers = await db.select().from(users).limit(1);
            const isFirstUser = allUsers.length === 0;

            if (!isFirstUser) {
                return { success: false, error: "Registration is currently closed." };
            }

            const passwordHash = await Bun.password.hash(password);
            const role = 'admin';

            try {
                await db.insert(users).values({
                    username,
                    passwordHash,
                    role,
                });
                return { success: true };
            } catch (e) {
                return { success: false, error: "User already exists" };
            }
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
        }
    )
    .post(
        "/auth/login",
        async ({ body, jwt }) => {
            const { username, password } = body;
            const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

            if (!user.length) {
                return { success: false, error: "Invalid credentials" };
            }

            const valid = await Bun.password.verify(password, user[0].passwordHash);
            if (!valid) {
                return { success: false, error: "Invalid credentials" };
            }

            const token = await jwt.sign({
                id: user[0].id,
                username: user[0].username,
                role: user[0].role,
            });

            return { success: true, token };
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
        }
    );
