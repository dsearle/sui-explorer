import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Supabase direct postgres connection
// Password = service role key (Supabase uses JWT as postgres password)
const client = new pg.Client({
  host: 'aws-0-eu-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.tzbbeleucvwgexfrwyrh',
  password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YmJlbGV1Y3Z3Z2V4ZnJ3eXJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY0MzY1MiwiZXhwIjoyMDkxMjE5NjUyfQ.Cm6k4xZrKEMaAOwEfs5X-C1J_2KExi62obd3u8d80aY',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

const schema = readFileSync(join(__dirname, '../supabase/schema.sql'), 'utf8')

try {
  await client.connect()
  console.log('Connected to Supabase Postgres')
  await client.query(schema)
  console.log('Schema applied successfully')
} catch (err) {
  console.error('Error:', err.message)
} finally {
  await client.end()
}
