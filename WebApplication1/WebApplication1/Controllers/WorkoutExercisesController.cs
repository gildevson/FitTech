using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class WorkoutExercisesController : ControllerBase
{
    private readonly IWorkoutExerciseRepository _repository;

    public WorkoutExercisesController(IWorkoutExerciseRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetByWorkout([FromQuery] Guid workoutId) =>
        Ok(await _repository.GetByWorkoutAsync(workoutId));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkoutExerciseDto dto)
    {
        var we = new WorkoutExercise
        {
            WorkoutId = dto.WorkoutId,
            ExerciseId = dto.ExerciseId,
            Sets = dto.Sets,
            Reps = dto.Reps,
            RestSeconds = dto.RestSeconds,
            OrderIndex = dto.OrderIndex,
            Notes = dto.Notes
        };
        var id = await _repository.CreateAsync(we);
        we.Id = id;
        return CreatedAtAction(nameof(GetById), new { id }, we);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWorkoutExerciseDto dto)
    {
        var we = new WorkoutExercise
        {
            Id = id,
            Sets = dto.Sets,
            Reps = dto.Reps,
            RestSeconds = dto.RestSeconds,
            OrderIndex = dto.OrderIndex,
            Notes = dto.Notes,
            // Uma carga por série: corta o excesso se o número de séries diminuiu
            SetWeights = dto.SetWeights?.Take(dto.Sets).ToList()
        };
        if (dto.SetWeights?.Any(w => w is < 0 or > 1000) == true || dto.Sets is < 1 or > 50 || dto.RestSeconds is < 0 or > 3600)
            return BadRequest(new { message = "Valores inválidos." });
        var updated = await _repository.UpdateAsync(we, dto.SetWeightsProvided);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
