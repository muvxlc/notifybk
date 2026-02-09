import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
});

try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const [tables] = await connection.query('SHOW TABLES');
    for (const row of (tables as any[])) {
        const tableName = Object.values(row)[0];
        console.log(`Dropping table ${tableName}...`);
        await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('All tables dropped.');
} catch (e) {
    console.error(e);
} finally {
    await connection.end();
}
