using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/workoutlogs")]
[Authorize]
public class WorkoutLogsController : ControllerBase
{
    private readonly IWorkoutLogRepository _repo;
    public WorkoutLogsController(IWorkoutLogRepository repo) => _repo = repo;

    private static readonly TimeZoneInfo BrazilTz = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
    private static DateTime TodayInBrazil() => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BrazilTz).Date;

    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var logs = await _repo.GetByUserAsync(userId);
        return Ok(logs);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkoutLogDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        // Sem data do app, usa o dia de Brasília (UTC viraria "amanhã" depois das 21h)
        var date = dto.LoggedDate?.Date ?? TodayInBrazil();

        var status = string.IsNullOrWhiteSpace(dto.Status) ? "done" : dto.Status.Trim().ToLowerInvariant();
        if (status is not ("done" or "skipped"))
            return BadRequest(new { message = "Status inválido. Use 'done' ou 'skipped'." });
        var reason = status == "skipped" ? dto.SkipReason?.Trim() : null;
        if (reason?.Length > 100) reason = reason[..100];

        var log = await _repo.CreateAsync(userId, dto.WorkoutId, date, status, reason);
        return log is null ? Conflict("Treino já registrado para esta data.") : Ok(log);
    }

    /// <summary>Grava (substitui) as cargas/repetições das séries de um treino registrado.</summary>
    [HttpPut("{id:guid}/sets")]
    public async Task<IActionResult> SaveSets(Guid id, [FromBody] List<WorkoutSetLogDto> sets)
    {
        if (sets.Any(s => s.WeightKg is < 0 or > 1000 || s.Reps is < 0 or > 1000 || s.SetIndex is < 0 or > 50))
            return BadRequest(new { message = "Valores de carga ou repetições inválidos." });

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var saved = await _repo.ReplaceSetsAsync(id, userId, sets);
        return saved ? NoContent() : NotFound();
    }

    /// <summary>Última carga usada em cada série do treino, para pré-preencher a sessão.</summary>
    [HttpGet("last-sets")]
    public async Task<IActionResult> GetLastSets([FromQuery] Guid workoutId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _repo.GetLastSetsAsync(userId, workoutId));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _repo.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpGet("admin/stats")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _repo.GetStatsAsync();
        return Ok(stats);
    }

    [HttpGet("admin/users")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetUserStats()
    {
        var stats = await _repo.GetUserStatsAsync();
        return Ok(stats);
    }

    [HttpGet("admin/users/{userId:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetUserLogs(Guid userId)
    {
        var logs = await _repo.GetUserLogsAsync(userId);
        return Ok(logs);
    }
}
