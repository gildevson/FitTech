public interface IWorkoutExerciseRepository
{
    Task<IEnumerable<WorkoutExercise>> GetByWorkoutAsync(Guid workoutId);
    Task<WorkoutExercise?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(WorkoutExercise workoutExercise);
    Task<bool> UpdateAsync(WorkoutExercise workoutExercise, bool updateWeights = false);
    Task<bool> DeleteAsync(Guid id);
}
