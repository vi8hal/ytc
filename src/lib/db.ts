
import { sql } from '@vercel/postgres';
import { db as vercelDb } from '@vercel/postgres';

// A simple client for interacting with the database
export const db = {
  query: sql,
  getClient: () => vercelDb.connect(),
};

export async function initializeDb() {
    console.log('Checking for database tables...');
    const client = await db.getClient();
    try {
        // Create users table if it doesn't exist
        const usersTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!usersTableExists.rows[0].exists) {
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

        // Create user_settings table if it doesn't exist
        const settingsTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_settings'
            );
        `);

        if (!settingsTableExists.rows[0].exists) {
            console.log('User settings table not found. Creating it...');
            await client.query(`
                CREATE TABLE user_settings (
                    id SERIAL PRIMARY KEY,
                    "userId" INTEGER UNIQUE NOT NULL,
                    "youtubeApiKey" VARCHAR(255),
                    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log('User settings table created successfully.');
        } else {
            console.log('User settings table already exists.');
        }

    } catch (error) {
        console.error('Error during database initialization:', error);
        throw new Error('Could not initialize database.');
    } finally {
        client.release();
    }
}
