
import { db as vercelDb, VercelPoolClient, sql } from '@vercel/postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// We are exporting the vercelDb instance directly as 'db',
// and it provides the 'query' method that the rest of the app expects.
export const db = vercelDb;

export async function getClient(): Promise<VercelPoolClient> {
    // Vercel's driver manages connections automatically, but for transactions,
    // we need to explicitly get a client from the pool.
    return vercelDb.connect();
}


export async function initializeDb() {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        
        // Original users table
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
        
        // New table for storing multiple credential sets per user
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_credentials (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL,
                "credentialName" VARCHAR(255) NOT NULL,
                "youtubeApiKey" VARCHAR(255) NOT NULL,
                "googleClientId" VARCHAR(255) NOT NULL,
                "googleClientSecret" VARCHAR(255) NOT NULL,
                "googleRedirectUri" VARCHAR(255) NOT NULL,
                "googleAccessToken" TEXT,
                "googleRefreshToken" TEXT,
                "googleTokenExpiry" TIMESTAMP,
                "isConnected" BOOLEAN DEFAULT FALSE,
                FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE("userId", "credentialName")
            );
        `);

        // Drop the old user_settings table as it's replaced by user_credentials
        await client.query('DROP TABLE IF EXISTS user_settings;');
        
        // Remove old column from users table if it exists
        try {
            await client.query('ALTER TABLE users DROP COLUMN "youtubeApiKey";');
        } catch (error: any) {
            // Ignore error if column doesn't exist (e.g., on a fresh install)
            if (error.code !== '42703') { 
                throw error;
            }
        }


        await client.query('COMMIT');
        console.log('Database tables initialized or already exist.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during database initialization:', error);
        throw error;
    } finally {
        client.release();
    }
}
