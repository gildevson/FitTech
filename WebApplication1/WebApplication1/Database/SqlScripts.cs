public static class SqlScripts
{
    public static readonly string CreateTables = """
        CREATE TABLE IF NOT EXISTS muscle_groups (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS exercises (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            muscle_group_id INT REFERENCES muscle_groups(id) ON DELETE SET NULL,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS workout_plans (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS workouts (
            id SERIAL PRIMARY KEY,
            workout_plan_id INT REFERENCES workout_plans(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            day_of_week INT NOT NULL DEFAULT 0,
            order_index INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS workout_exercises (
            id SERIAL PRIMARY KEY,
            workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
            exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
            sets INT NOT NULL DEFAULT 3,
            reps VARCHAR(20) NOT NULL DEFAULT '10',
            rest_seconds INT NOT NULL DEFAULT 60,
            order_index INT NOT NULL DEFAULT 0,
            notes TEXT
        );
        """;
}
