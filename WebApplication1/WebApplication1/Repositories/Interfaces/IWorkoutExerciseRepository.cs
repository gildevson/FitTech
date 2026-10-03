public interface IWorkoutExerciseRepository
{
    Task<IEnumerable<WorkoutExercise>> GetByWorkoutAsync(Guid workoutId);
    Task<WorkoutExercise?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(WorkoutExercise workoutExercise);
    Task<bool> UpdateAsync(WorkoutExercise workoutExercise);
    Task<bool> DeleteAsync(Guid id);
}
