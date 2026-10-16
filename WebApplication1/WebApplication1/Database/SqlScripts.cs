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

        CREATE TABLE IF NOT EXISTS diets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(150) NOT NULL,
            description TEXT,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS meals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            diet_id UUID REFERENCES diets(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            meal_order INT NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS meal_foods (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
            food_name VARCHAR(200) NOT NULL,
            quantity_grams DECIMAL(8,2) NOT NULL DEFAULT 100,
            calories DECIMAL(8,2) NOT NULL DEFAULT 0,
            protein DECIMAL(8,2) NOT NULL DEFAULT 0,
            carbs DECIMAL(8,2) NOT NULL DEFAULT 0,
            fat DECIMAL(8,2) NOT NULL DEFAULT 0,
            open_food_facts_id VARCHAR(100)
        );

        CREATE TABLE IF NOT EXISTS user_diets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            diet_id UUID REFERENCES diets(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, diet_id)
        );

        ALTER TABLE meal_foods ADD COLUMN IF NOT EXISTS serving_unit VARCHAR(50);
        ALTER TABLE meal_foods ADD COLUMN IF NOT EXISTS serving_grams DECIMAL(8,2);
        ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_time VARCHAR(5);
        ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

        ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(9);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS street VARCHAR(150);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS state CHAR(2);
        CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(5);

        -- Quem adicionou cada refeição/alimento: o aluno pode apagar o que ele mesmo adicionou,
        -- mesmo numa dieta compartilhada, sem mexer no que o personal montou
        ALTER TABLE meals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE meal_foods ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

        -- Carga planejada (kg) de cada série do exercício, em JSON: [40, 45, 50]
        ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS set_weights TEXT;

        -- Horário pessoal de uma refeição (dietas atribuídas são compartilhadas entre alunos)
        CREATE TABLE IF NOT EXISTS user_meal_times (
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
            meal_time VARCHAR(5) NOT NULL,
            PRIMARY KEY (user_id, meal_id)
        );

        CREATE TABLE IF NOT EXISTS workout_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
            logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, workout_id, logged_date)
        );

        -- done = treinou | skipped = pulou de propósito (sem tempo, machucado...)
        ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'done';
        ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS skip_reason VARCHAR(100);

        -- Carga e repetições de cada série feita num treino
        CREATE TABLE IF NOT EXISTS workout_set_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
            workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
            set_index INT NOT NULL,
            weight_kg DECIMAL(6,2),
            reps INT,
            UNIQUE (workout_log_id, workout_exercise_id, set_index)
        );
        CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON workout_set_logs(workout_exercise_id);

        CREATE TABLE IF NOT EXISTS user_workout_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, workout_id)
        );

        -- Medidas corporais registradas pelo aluno (circunferências em cm, peso em kg)
        CREATE TABLE IF NOT EXISTS body_measurements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            measured_date DATE NOT NULL DEFAULT CURRENT_DATE,
            weight_kg DECIMAL(5,2),
            neck_cm DECIMAL(5,1),
            shoulders_cm DECIMAL(5,1),
            chest_cm DECIMAL(5,1),
            waist_cm DECIMAL(5,1),
            hip_cm DECIMAL(5,1),
            right_arm_cm DECIMAL(5,1),
            left_arm_cm DECIMAL(5,1),
            right_thigh_cm DECIMAL(5,1),
            left_thigh_cm DECIMAL(5,1),
            right_calf_cm DECIMAL(5,1),
            left_calf_cm DECIMAL(5,1),
            notes VARCHAR(300),
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id, measured_date DESC);

        -- Sexo e altura: necessários para estimar o percentual de gordura (fórmula da Marinha dos EUA)
        ALTER TABLE users ADD COLUMN IF NOT EXISTS sex VARCHAR(1);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,1);

        -- Data de nascimento: a classificação do IMC muda com a idade (adulto x idoso)
        ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
        """;
}
