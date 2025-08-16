
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = {
  query: (text: string, params?: any[]) => client.query(text, params),
  getClient: () => client.connect(),
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
        console.log('Database tables initialized or already exist.');
    } catch (error) {
        console.error('Error during database initialization:', error);
        throw error;
    } finally {
        client.release();
    }
}
