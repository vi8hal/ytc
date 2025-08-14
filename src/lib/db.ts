
import { sql } from '@vercel/postgres';
import { db as vercelDb } from '@vercel/postgres';

// A simple client for interacting with the database
export const db = {
  query: sql,
  getClient: () => vercelDb.connect(),
};

export async function initializeDb() {
    const client = await db.getClient();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                otp VARCHAR(10),
                "otpExpires" TIMESTAMP
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER UNIQUE NOT NULL,
                "youtubeApiKey" VARCHAR(255),
                FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
            );
        `);
    } catch (error) {
        // Don't throw during init, just log. The app might still work.
        console.error('Error during database initialization:', error);
    } finally {
        client.release();
    }
}
