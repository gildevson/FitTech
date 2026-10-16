using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly JwtService _jwtService;

    public AuthController(IUserRepository userRepository, JwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email);

        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email ou senha inválidos" });

        var token = _jwtService.GenerateToken(user);

        return Ok(new LoginResponseDto
        {
            Token = token,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            UserId = user.Id,
            Language = user.Language
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var name = dto.Name?.Trim() ?? string.Empty;
        var email = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;

        if (name.Length < 2)
            return BadRequest(new { message = "Informe seu nome." });
        if (!System.Net.Mail.MailAddress.TryCreate(email, out _))
            return BadRequest(new { message = "E-mail inválido." });
        if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < 6)
            return BadRequest(new { message = "A senha deve ter pelo menos 6 caracteres." });

        if (await _userRepository.GetByEmailAsync(email) is not null)
            return Conflict(new { message = "Email já cadastrado" });

        // Cadastro público sempre cria perfil comum; admin só via painel.
        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "user",
            IsActive = true,
            Language = NormalizeLanguage(dto.Language)
        };
        user.ApplyAddress(dto);
        user.Id = await _userRepository.CreateAsync(user);

        return Ok(new LoginResponseDto
        {
            Token = _jwtService.GenerateToken(user),
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            UserId = user.Id,
            Language = user.Language
        });
    }

    /// <summary>Salva o idioma preferido do usuário logado (vale em qualquer aparelho).</summary>
    [Authorize]
    [HttpPut("language")]
    public async Task<IActionResult> UpdateLanguage([FromBody] UpdateLanguageDto dto)
    {
        var language = NormalizeLanguage(dto.Language);
        if (language is null)
            return BadRequest(new { message = "Idioma inválido. Use pt, en ou es." });

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _userRepository.UpdateLanguageAsync(userId, language) ? NoContent() : NotFound();
    }

    private static string? NormalizeLanguage(string? lang)
    {
        var l = lang?.Trim().ToLowerInvariant();
        return l is "pt" or "en" or "es" ? l : null;
    }
}
