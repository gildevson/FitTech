using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _repository;

    public UsersController(IUserRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _repository.GetAllAsync();
        return Ok(users.Select(ToDto));
    }

    [HttpGet("stats/by-state")]
    public async Task<IActionResult> CountByState() =>
        Ok(await _repository.CountByStateAsync());

    [HttpGet("stats/by-city")]
    public async Task<IActionResult> CountByCity([FromQuery] string state) =>
        Ok(await _repository.CountByCityAsync(state));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user is null) return NotFound();
        return Ok(ToDto(user));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var existing = await _repository.GetByEmailAsync(dto.Email);
        if (existing is not null)
            return Conflict(new { message = "Email já cadastrado" });

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            IsActive = true
        };
        user.ApplyAddress(dto);

        var id = await _repository.CreateAsync(user);
        user.Id = id;

        return CreatedAtAction(nameof(GetById), new { id }, ToDto(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user is null) return NotFound();

        user.Name = dto.Name;
        user.Email = dto.Email;
        user.Role = dto.Role;
        user.IsActive = dto.IsActive;
        user.ApplyAddress(dto);

        var updated = await _repository.UpdateAsync(user);
        return updated ? NoContent() : NotFound();
    }

    [HttpPatch("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id, [FromBody] bool isActive)
    {
        var toggled = await _repository.ToggleActiveAsync(id, isActive);
        return toggled ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _repository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    private static UserResponseDto ToDto(User u) => new()
    {
        Id = u.Id,
        Name = u.Name,
        Email = u.Email,
        Role = u.Role,
        IsActive = u.IsActive,
        CreatedAt = u.CreatedAt,
        ZipCode = u.ZipCode,
        Street = u.Street,
        AddressNumber = u.AddressNumber,
        Complement = u.Complement,
        Neighborhood = u.Neighborhood,
        City = u.City,
        State = u.State
    };
}
