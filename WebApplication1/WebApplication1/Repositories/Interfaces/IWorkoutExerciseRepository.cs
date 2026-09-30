public interface IWorkoutExerciseRepository
{
    Task<IEnumerable<WorkoutExercise>> GetByWorkoutAsync(int workoutId);
    Task<WorkoutExercise?> GetByIdAsync(int id);
    Task<int> CreateAsync(WorkoutExercise workoutExercise);
    Task<bool> UpdateAsync(WorkoutExercise workoutExercise);
    Task<bool> DeleteAsync(int id);
}
