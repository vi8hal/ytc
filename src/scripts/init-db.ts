
// This script is used to initialize the database tables from the command line.
// Environment variables are loaded via the --env-file flag in the package.json script.
import { initializeDb } from '../lib/db';

async function main() {
    console.log('Starting database initialization...');
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set. Please check your .env file and ensure the db:init script in package.json is using --env-file.');
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
