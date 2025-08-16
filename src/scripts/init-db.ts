
// This script is used to initialize the database tables from the command line.
import { initializeDb } from '../lib/db';
import { config } from 'dotenv';
import { neon, neonConfig } from '@neondatabase/serverless';

config({ path: '.env.local' });
config();

async function main() {
    console.log('Starting database initialization...');
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set. Please check your .env file.');
    }
    try {
        await initializeDb();
        console.log('Database initialization completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to initialize the database:', error);
        process.exit(1);
    }
}

main();
