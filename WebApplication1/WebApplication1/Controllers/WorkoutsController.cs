using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class WorkoutsController : ControllerBase
{
    private readonly IWorkoutRepository _repository;

    public WorkoutsController(IWorkoutRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? workoutPlanId)
    {
        if (workoutPlanId.HasValue)
            return Ok(await _repository.GetByWorkoutPlanAsync(workoutPlanId.Value));
        return Ok(await _repository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkoutDto dto)
    {
        var workout = new Workout
        {
            WorkoutPlanId = dto.WorkoutPlanId,
            Name = dto.Name,
            DayOfWeek = dto.DayOfWeek,
            OrderIndex = dto.OrderIndex
        };
        var id = await _repository.CreateAsync(workout);
        workout.Id = id;
        return CreatedAtAction(nameof(GetById), new { id }, workout);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateWorkoutDto dto)
    {
        var workout = new Workout
        {
            Id = id,
            WorkoutPlanId = dto.WorkoutPlanId,
            Name = dto.Name,
            DayOfWeek = dto.DayOfWeek,
            OrderIndex = dto.OrderIndex
        };
        var updated = await _repository.UpdateAsync(workout);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
