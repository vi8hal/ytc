// This script is used to initialize the database tables from the command line.
import { initializeDb } from '../lib/db';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env' });

async function main() {
    console.log('Starting database initialization...');
    try {
        // The initializeDb function contains the CREATE TABLE IF NOT EXISTS queries.
        await initializeDb();
        console.log('Database initialization completed successfully.');
        // Exit the process cleanly.
        process.exit(0);
    } catch (error) {
        console.error('Failed to initialize the database:', error);
        // Exit with an error code if something goes wrong.
        process.exit(1);
    }
}

main();
