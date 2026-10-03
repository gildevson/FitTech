using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class WorkoutPlansController : ControllerBase
{
    private readonly IWorkoutPlanRepository _repository;

    public WorkoutPlansController(IWorkoutPlanRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _repository.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkoutPlanDto dto)
    {
        var plan = new WorkoutPlan { Name = dto.Name, Description = dto.Description };
        var id = await _repository.CreateAsync(plan);
        plan.Id = id;
        return CreatedAtAction(nameof(GetById), new { id }, plan);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWorkoutPlanDto dto)
    {
        var plan = new WorkoutPlan { Id = id, Name = dto.Name, Description = dto.Description };
        var updated = await _repository.UpdateAsync(plan);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
