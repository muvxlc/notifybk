import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
});

try {
    console.log('--- Query Logs ---');
    const [qLogs] = await connection.query(`SELECT id, config_id, executed_at, status, result_summary, error_details FROM query_logs ORDER BY id DESC LIMIT 5`);
    console.table(qLogs);

    console.log('--- Notification Logs ---');
    const [nLogs] = await connection.query(`SELECT id, config_id, type, status, message, created_at FROM notification_logs ORDER BY id DESC LIMIT 5`);
    console.table(nLogs);
} catch (e) {
    console.error(e);
} finally {
    await connection.end();
}
