using Dapper;

public class WorkoutExerciseRepository : IWorkoutExerciseRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public WorkoutExerciseRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<WorkoutExercise>> GetByWorkoutAsync(int workoutId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<WorkoutExercise>("""
            SELECT we.id, we.workout_id AS WorkoutId, we.exercise_id AS ExerciseId,
                   we.sets, we.reps, we.rest_seconds AS RestSeconds,
                   we.order_index AS OrderIndex, we.notes,
                   e.name AS ExerciseName, mg.name AS MuscleGroupName
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
            WHERE we.workout_id = @WorkoutId
            ORDER BY we.order_index
            """, new { WorkoutId = workoutId });
    }

    public async Task<WorkoutExercise?> GetByIdAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<WorkoutExercise>("""
            SELECT we.id, we.workout_id AS WorkoutId, we.exercise_id AS ExerciseId,
                   we.sets, we.reps, we.rest_seconds AS RestSeconds,
                   we.order_index AS OrderIndex, we.notes,
                   e.name AS ExerciseName, mg.name AS MuscleGroupName
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
            WHERE we.id = @Id
            """, new { Id = id });
    }

    public async Task<int> CreateAsync(WorkoutExercise workoutExercise)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<int>("""
            INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index, notes)
            VALUES (@WorkoutId, @ExerciseId, @Sets, @Reps, @RestSeconds, @OrderIndex, @Notes)
            RETURNING id
            """, workoutExercise);
    }

    public async Task<bool> UpdateAsync(WorkoutExercise workoutExercise)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("""
            UPDATE workout_exercises SET sets = @Sets, reps = @Reps,
            rest_seconds = @RestSeconds, order_index = @OrderIndex, notes = @Notes
            WHERE id = @Id
            """, workoutExercise);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM workout_exercises WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
