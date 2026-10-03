using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ExercisesController : ControllerBase
{
    private readonly IExerciseRepository _repository;

    public ExercisesController(IExerciseRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? muscleGroupId)
    {
        if (muscleGroupId.HasValue)
            return Ok(await _repository.GetByMuscleGroupAsync(muscleGroupId.Value));
        return Ok(await _repository.GetAllAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExerciseDto dto)
    {
        var exercise = new Exercise
        {
            Name = dto.Name,
            Description = dto.Description,
            MuscleGroupId = dto.MuscleGroupId,
            ImageUrl = dto.ImageUrl
        };
        var id = await _repository.CreateAsync(exercise);
        exercise.Id = id;
        return CreatedAtAction(nameof(GetById), new { id }, exercise);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExerciseDto dto)
    {
        var exercise = new Exercise
        {
            Id = id,
            Name = dto.Name,
            Description = dto.Description,
            MuscleGroupId = dto.MuscleGroupId,
            ImageUrl = dto.ImageUrl
        };
        var updated = await _repository.UpdateAsync(exercise);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
