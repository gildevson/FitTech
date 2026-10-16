using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/measurements")]
[Authorize]
public class MeasurementsController : ControllerBase
{
    private readonly IBodyMeasurementRepository _repo;
    public MeasurementsController(IBodyMeasurementRepository repo) => _repo = repo;

    private static readonly TimeZoneInfo BrazilTz = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
    private static DateTime TodayInBrazil() => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BrazilTz).Date;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Histórico de medidas do usuário logado (mais recentes primeiro).</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMine() =>
        Ok(await _repo.GetByUserAsync(CurrentUserId));

    /// <summary>Histórico de medidas de um aluno (só administrador).</summary>
    [HttpGet("user/{userId:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetByUser(Guid userId) =>
        Ok(await _repo.GetByUserAsync(userId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveBodyMeasurementDto dto)
    {
        var values = dto.Values().ToList();
        if (values.All(v => v is null))
            return BadRequest(new { message = "Informe pelo menos uma medida." });
        if (values.Any(v => v is <= 0 or > 500))
            return BadRequest(new { message = "Valores inválidos. Use números maiores que 0." });

        var date = dto.MeasuredDate?.Date ?? TodayInBrazil();
        if (date > TodayInBrazil())
            return BadRequest(new { message = "A data não pode ser no futuro." });

        var notes = dto.Notes?.Trim();
        if (notes?.Length > 300) notes = notes[..300];
        dto.Notes = string.IsNullOrEmpty(notes) ? null : notes;

        return Ok(await _repo.CreateAsync(CurrentUserId, date, dto));
    }

    /// <summary>Sexo, altura e data de nascimento do usuário logado (gordura corporal e IMC).</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile() =>
        Ok(await _repo.GetProfileAsync(CurrentUserId));

    [HttpPut("profile")]
    public async Task<IActionResult> SaveProfile([FromBody] BodyProfileDto dto)
    {
        var sex = dto.Sex?.Trim().ToUpperInvariant();
        if (sex is not null and not ("M" or "F"))
            return BadRequest(new { message = "Sexo inválido. Use 'M' ou 'F'." });
        if (dto.HeightCm is <= 0 or < 80 or > 250)
            return BadRequest(new { message = "Altura inválida (entre 80 e 250 cm)." });
        if (dto.BirthDate is { } birth && (birth.Date > DateTime.UtcNow.Date || birth.Year < 1900))
            return BadRequest(new { message = "Data de nascimento inválida." });

        await _repo.SaveProfileAsync(CurrentUserId, sex, dto.HeightCm, dto.BirthDate);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await _repo.DeleteAsync(id, CurrentUserId) ? NoContent() : NotFound();
}
