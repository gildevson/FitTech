using Dapper;

public class WorkoutLogRepository : IWorkoutLogRepository
{
    private readonly DbConnectionFactory _db;
    public WorkoutLogRepository(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<WorkoutLog>> GetByUserAsync(Guid userId, int days = 60)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<WorkoutLog>(
            @"SELECT id, user_id AS UserId, workout_id AS WorkoutId,
                     logged_date AS LoggedDate, status, skip_reason AS SkipReason, created_at AS CreatedAt
              FROM workout_logs
              WHERE user_id = @UserId AND logged_date >= CURRENT_DATE - @Days
              ORDER BY logged_date DESC",
            new { UserId = userId, Days = days });
    }

    public async Task<WorkoutLog?> CreateAsync(Guid userId, Guid workoutId, DateTime date, string status = "done", string? skipReason = null)
    {
        using var conn = _db.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<WorkoutLog>(
            @"INSERT INTO workout_logs (user_id, workout_id, logged_date, status, skip_reason)
              VALUES (@UserId, @WorkoutId, @Date, @Status, @SkipReason)
              ON CONFLICT (user_id, workout_id, logged_date) DO NOTHING
              RETURNING id, user_id AS UserId, workout_id AS WorkoutId,
                        logged_date AS LoggedDate, status, skip_reason AS SkipReason, created_at AS CreatedAt",
            new { UserId = userId, WorkoutId = workoutId, Date = date.Date, Status = status, SkipReason = skipReason });
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "DELETE FROM workout_logs WHERE id = @Id AND user_id = @UserId",
            new { Id = id, UserId = userId });
    }

    public async Task<WorkoutStatsDto> GetStatsAsync()
    {
        using var conn = _db.CreateConnection();

        var recent = await conn.QueryAsync<RecentWorkoutLogDto>(
            @"SELECT wl.id, u.name AS UserName, w.name AS WorkoutName,
                     wp.name AS PlanName, wl.logged_date AS LoggedDate, wl.created_at AS CreatedAt
              FROM workout_logs wl
              JOIN users u ON u.id = wl.user_id
              JOIN workouts w ON w.id = wl.workout_id
              JOIN workout_plans wp ON wp.id = w.workout_plan_id
              WHERE wl.status = 'done'
              ORDER BY wl.logged_date DESC, wl.created_at DESC
              LIMIT 15");

        var popular = await conn.QueryAsync<PopularPlanDto>(
            @"SELECT wp.name AS PlanName,
                     COUNT(*) AS LogCount,
                     COUNT(DISTINCT wl.user_id) AS UserCount
              FROM workout_logs wl
              JOIN workouts w ON w.id = wl.workout_id
              JOIN workout_plans wp ON wp.id = w.workout_plan_id
              WHERE wp.user_id IS NULL AND wl.status = 'done'
              GROUP BY wp.id, wp.name
              ORDER BY UserCount DESC
              LIMIT 8");

        return new WorkoutStatsDto { RecentActivity = recent, PopularPlans = popular };
    }

    public async Task<IEnumerable<UserWorkoutStatsDto>> GetUserStatsAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<UserWorkoutStatsDto>(
            @"SELECT
                u.id AS Id,
                u.name AS Name,
                u.email AS Email,
                COUNT(wl.id) AS TotalLogs,
                COUNT(CASE WHEN wl.logged_date >= CURRENT_DATE - 6 THEN 1 END) AS LogsThisWeek,
                COUNT(CASE WHEN wl.logged_date >= date_trunc('month', CURRENT_DATE) THEN 1 END) AS LogsThisMonth,
                MAX(wl.logged_date) AS LastWorkoutDate
              FROM users u
              LEFT JOIN workout_logs wl ON wl.user_id = u.id AND wl.status = 'done'
              WHERE u.role = 'user'
              GROUP BY u.id, u.name, u.email
              ORDER BY MAX(wl.logged_date) DESC NULLS LAST, u.name");
    }

    public async Task<IEnumerable<UserWorkoutLogDto>> GetUserLogsAsync(Guid userId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<UserWorkoutLogDto>(
            @"SELECT wl.id AS Id, wl.logged_date AS LoggedDate,
                     w.name AS WorkoutName, wp.name AS PlanName,
                     wl.status AS Status, wl.skip_reason AS SkipReason
              FROM workout_logs wl
              JOIN workouts w ON w.id = wl.workout_id
              JOIN workout_plans wp ON wp.id = w.workout_plan_id
              WHERE wl.user_id = @UserId
              ORDER BY wl.logged_date DESC
              LIMIT 30",
            new { UserId = userId });
    }

    /// <summary>Treinos registrados entre duas datas (inclusive), com nome do treino e da ficha.</summary>
    public async Task<IEnumerable<UserWorkoutLogDto>> GetByPeriodAsync(Guid userId, DateTime from, DateTime to)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<UserWorkoutLogDto>(
            @"SELECT wl.id AS Id, wl.logged_date AS LoggedDate,
                     w.name AS WorkoutName, wp.name AS PlanName,
                     wl.status AS Status, wl.skip_reason AS SkipReason
              FROM workout_logs wl
              JOIN workouts w ON w.id = wl.workout_id
              JOIN workout_plans wp ON wp.id = w.workout_plan_id
              WHERE wl.user_id = @UserId AND wl.logged_date BETWEEN @From AND @To
              ORDER BY wl.logged_date, wl.created_at",
            new { UserId = userId, From = from.Date, To = to.Date });
    }

    /// <summary>Dias treinados/pulados e total de treinos por mês, a partir de uma data. Meses sem registro não aparecem.</summary>
    public async Task<IEnumerable<MonthlyFrequencyDto>> GetMonthlyFrequencyAsync(Guid userId, DateTime from)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<MonthlyFrequencyDto>(
            @"SELECT EXTRACT(YEAR FROM day)::int AS Year, EXTRACT(MONTH FROM day)::int AS Month,
                     COUNT(*) FILTER (WHERE done > 0)::int AS DoneDays,
                     COUNT(*) FILTER (WHERE done = 0)::int AS SkippedDays,
                     SUM(done)::int AS Workouts
              FROM (
                  SELECT logged_date AS day, COUNT(*) FILTER (WHERE status = 'done') AS done
                  FROM workout_logs
                  WHERE user_id = @UserId AND logged_date >= @From
                  GROUP BY logged_date
              ) d
              GROUP BY 1, 2
              ORDER BY 1, 2",
            new { UserId = userId, From = from.Date });
    }

    public async Task<bool> ReplaceSetsAsync(Guid logId, Guid userId, IEnumerable<WorkoutSetLogDto> sets)
    {
        using var conn = _db.CreateConnection();
        conn.Open();
        using var tx = conn.BeginTransaction();

        // Só o dono do registro pode gravar as séries
        var owns = await conn.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM workout_logs WHERE id = @LogId AND user_id = @UserId)",
            new { LogId = logId, UserId = userId }, tx);
        if (!owns) return false;

        await conn.ExecuteAsync("DELETE FROM workout_set_logs WHERE workout_log_id = @LogId", new { LogId = logId }, tx);
        await conn.ExecuteAsync(
            @"INSERT INTO workout_set_logs (workout_log_id, workout_exercise_id, set_index, weight_kg, reps)
              VALUES (@LogId, @WorkoutExerciseId, @SetIndex, @WeightKg, @Reps)",
            sets.Select(s => new { LogId = logId, s.WorkoutExerciseId, s.SetIndex, s.WeightKg, s.Reps }), tx);

        tx.Commit();
        return true;
    }

    /// <summary>Carga mais recente de cada série de cada exercício do treino (para pré-preencher)</summary>
    public async Task<IEnumerable<WorkoutSetLogDto>> GetLastSetsAsync(Guid userId, Guid workoutId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<WorkoutSetLogDto>(
            @"SELECT DISTINCT ON (s.workout_exercise_id, s.set_index)
                     s.workout_exercise_id AS WorkoutExerciseId, s.set_index AS SetIndex,
                     s.weight_kg AS WeightKg, s.reps AS Reps
              FROM workout_set_logs s
              JOIN workout_logs wl ON wl.id = s.workout_log_id
              JOIN workout_exercises we ON we.id = s.workout_exercise_id
              WHERE wl.user_id = @UserId AND we.workout_id = @WorkoutId AND s.weight_kg IS NOT NULL
              ORDER BY s.workout_exercise_id, s.set_index, wl.logged_date DESC, wl.created_at DESC",
            new { UserId = userId, WorkoutId = workoutId });
    }
}
