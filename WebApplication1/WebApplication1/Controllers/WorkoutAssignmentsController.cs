using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/workout-assignments")]
[Authorize]
public class WorkoutAssignmentsController : ControllerBase
{
    private readonly IUserWorkoutAssignmentRepository _repo;
    public WorkoutAssignmentsController(IUserWorkoutAssignmentRepository repo) => _repo = repo;

    // GET /api/workout-assignments/me — app mobile: treinos atribuídos ao usuário logado
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _repo.GetByUserAsync(userId));
    }

    // GET /api/workout-assignments/user/{userId} — admin: treinos atribuídos a um aluno
    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetByUser(Guid userId)
        => Ok(await _repo.GetByUserAsync(userId));

    // GET /api/workout-assignments/{workoutId}/assignees — admin: quem tem esse treino
    [HttpGet("{workoutId:guid}/assignees")]
    public async Task<IActionResult> GetAssignees(Guid workoutId)
        => Ok(await _repo.GetAssigneesAsync(workoutId));

    // POST /api/workout-assignments/{workoutId} — admin: atribuir a lista de usuários
    [HttpPost("{workoutId:guid}")]
    public async Task<IActionResult> Assign(Guid workoutId, [FromBody] AssignWorkoutDto dto)
    {
        await _repo.AssignAsync(workoutId, dto.UserIds);
        return Ok();
    }

    // DELETE /api/workout-assignments/{workoutId}/user/{userId} — admin: remover atribuição
    [HttpDelete("{workoutId:guid}/user/{userId:guid}")]
    public async Task<IActionResult> Unassign(Guid workoutId, Guid userId)
    {
        await _repo.UnassignAsync(workoutId, userId);
        return NoContent();
    }
}
