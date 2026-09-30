using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class MuscleGroupsController : ControllerBase
{
    private readonly IMuscleGroupRepository _repository;

    public MuscleGroupsController(IMuscleGroupRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _repository.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMuscleGroupDto dto)
    {
        var muscleGroup = new MuscleGroup { Name = dto.Name, Description = dto.Description };
        var id = await _repository.CreateAsync(muscleGroup);
        muscleGroup.Id = id;
        return CreatedAtAction(nameof(GetById), new { id }, muscleGroup);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMuscleGroupDto dto)
    {
        var muscleGroup = new MuscleGroup { Id = id, Name = dto.Name, Description = dto.Description };
        var updated = await _repository.UpdateAsync(muscleGroup);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
