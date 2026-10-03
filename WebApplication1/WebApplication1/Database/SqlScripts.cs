public static class SqlScripts
{
    public static readonly string CreateTables = """
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE IF NOT EXISTS muscle_groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS exercises (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE SET NULL,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS workout_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS workouts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            day_of_week INT NOT NULL DEFAULT 0,
            order_index INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS workout_exercises (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
            exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
            sets INT NOT NULL DEFAULT 3,
            reps VARCHAR(20) NOT NULL DEFAULT '10',
            rest_seconds INT NOT NULL DEFAULT 60,
            order_index INT NOT NULL DEFAULT 0,
            notes TEXT
        );

        -- Drop and recreate users if it was created with wrong schema (non-UUID id)
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'id'
                AND data_type <> 'uuid'
            ) THEN
                DROP TABLE IF EXISTS users CASCADE;
            END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """;
}
