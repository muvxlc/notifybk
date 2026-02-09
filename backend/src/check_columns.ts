import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
});

try {
    const [rows] = await connection.query(`SHOW COLUMNS FROM query_configs`);
    console.log('Columns in query_configs:');
    console.table(rows);
} catch (e) {
    console.error(e);
} finally {
    await connection.end();
}
