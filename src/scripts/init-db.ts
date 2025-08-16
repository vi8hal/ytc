
// This script is used to initialize the database tables from the command line.
// It is crucial that dotenv.config() is called before any other imports
// that might depend on environment variables.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { initializeDb } from '../lib/db';

async function main() {
    console.log('Starting database initialization...');
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set. Please check your .env file and ensure it is loaded correctly.');
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
