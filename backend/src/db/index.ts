import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const MAX_RETRIES = 10;
const RETRY_DELAY = 2000; // 2 seconds

let connection;

for (let i = 0; i < MAX_RETRIES; i++) {
    try {
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
        });
        console.log('Database connected successfully');
        break;
    } catch (error) {
        console.error(`Database connection failed (attempt ${i + 1}/${MAX_RETRIES}):`, error);
        if (i === MAX_RETRIES - 1) {
            console.error('All connection attempts failed. Exiting...');
            process.exit(1);
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
}

export const db = drizzle(connection!, { schema, mode: 'default' });
