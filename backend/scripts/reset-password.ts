import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

const args = process.argv.slice(2);
const username = args[0];
const newPassword = args[1];

if (!username || !newPassword) {
    console.error("Usage: bun run scripts/reset-password.ts <username> <new_password>");
    process.exit(1);
}

console.log(`Resetting password for user: ${username}`);

const passwordHash = await Bun.password.hash(newPassword);

// Check if user exists
const existingUser = await db.select().from(users).where(eq(users.username, username));

if (existingUser.length === 0) {
    console.log("User not found. Creating new admin user...");
    await db.insert(users).values({
        username,
        passwordHash,
        role: "admin",
    });
    console.log("User created successfully.");
} else {
    await db.update(users)
        .set({ passwordHash })
        .where(eq(users.username, username));
    console.log("Password updated successfully.");
}

process.exit(0);
