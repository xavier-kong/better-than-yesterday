import { type Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
    throw 'No database url';
}

export default {
    schema: './drizzle/schema.ts',
    out: './drizzle/migrations',
    driver: 'turso',
    dbCredentials: {
        authToken: process.env.DATABASE_AUTH_TOKEN,
        url: process.env.DATABASE_URL,
    },
    verbose: true
} satisfies Config;
