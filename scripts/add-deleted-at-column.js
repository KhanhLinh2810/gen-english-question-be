const mysql = require('mysql2/promise');
require('dotenv').config();

async function addDeletedAtColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'question_gen',
    });

    console.log('Connected to database');

    // Check if column exists
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'exam_attempts' 
       AND COLUMN_NAME = 'deleted_at'`,
      [process.env.DB_NAME || 'question_gen']
    );

    if (columns.length > 0) {
      console.log('Column deleted_at already exists');
      return;
    }

    // Add column
    await connection.execute(
      `ALTER TABLE exam_attempts 
       ADD COLUMN deleted_at DATETIME NULL`
    );

    console.log('Successfully added deleted_at column to exam_attempts table');
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addDeletedAtColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

