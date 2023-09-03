import { type Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default {
    schema: './drizzle/schema.ts',
    out: './drizzle/migrations',
    driver: 'turso',
    dbCredentials: {
        url: process.env.DATABASE_URL,
        authToken: process.env.DATABASE_AUTH_TOKEN,
    }
} satisfies Config;
