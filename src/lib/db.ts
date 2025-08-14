import { sql } from '@vercel/postgres';
import { db as vercelDb } from '@vercel/postgres';

// A simple client for interacting with the database
export const db = {
  query: sql,
  getClient: () => vercelDb.connect(),
};

export async function initializeDb() {
    console.log('Checking for users table...');
    const client = await db.getClient();
    try {
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!tableExists.rows[0].exists) {
            console.log('Users table not found. Creating it...');
            await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    verified BOOLEAN DEFAULT FALSE,
                    otp VARCHAR(10),
                    "otpExpires" TIMESTAMP
                );
            `);
            console.log('Users table created successfully.');
        } else {
            console.log('Users table already exists.');
        }
    } catch (error) {
        console.error('Error during database initialization:', error);
        throw new Error('Could not initialize database.');
    } finally {
        client.release();
    }
}
