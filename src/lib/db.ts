
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
        
        // Users table
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
        
        // User Credentials table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_credentials (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                "credentialName" VARCHAR(255) NOT NULL,
                "youtubeApiKey" VARCHAR(255) NOT NULL,
                "googleClientId" VARCHAR(255) NOT NULL,
                "googleClientSecret" VARCHAR(255) NOT NULL,
                "googleRedirectUri" VARCHAR(255) NOT NULL,
                "googleAccessToken" TEXT,
                "googleRefreshToken" TEXT,
                "googleTokenExpiry" TIMESTAMP,
                "isConnected" BOOLEAN DEFAULT FALSE,
                UNIQUE("userId", "credentialName")
            );
        `);

        // Campaigns table
        await client.query(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                "credentialId" INTEGER NOT NULL REFERENCES user_credentials(id) ON DELETE RESTRICT,
                comments TEXT[] NOT NULL,
                "videoIds" TEXT[] NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Campaign Events table (for results)
        await client.query(`
            CREATE TABLE IF NOT EXISTS campaign_events (
                id SERIAL PRIMARY KEY,
                "campaignId" INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
                "videoId" VARCHAR(255) NOT NULL,
                comment TEXT NOT NULL,
                "postedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            );
        `);

        // Drop the old user_settings table as it's replaced by user_credentials
        await client.query('DROP TABLE IF EXISTS user_settings;');

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
