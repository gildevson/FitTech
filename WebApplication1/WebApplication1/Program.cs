using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();

builder.Services.AddSingleton<DbConnectionFactory>();
builder.Services.AddScoped<IMuscleGroupRepository, MuscleGroupRepository>();
builder.Services.AddScoped<IExerciseRepository, ExerciseRepository>();
builder.Services.AddScoped<IWorkoutPlanRepository, WorkoutPlanRepository>();
builder.Services.AddScoped<IWorkoutRepository, WorkoutRepository>();
builder.Services.AddScoped<IWorkoutExerciseRepository, WorkoutExerciseRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDietRepository, DietRepository>();
builder.Services.AddScoped<IMealRepository, MealRepository>();
builder.Services.AddScoped<IMealFoodRepository, MealFoodRepository>();
builder.Services.AddScoped<IUserDietRepository, UserDietRepository>();
builder.Services.AddScoped<IWorkoutLogRepository, WorkoutLogRepository>();
builder.Services.AddScoped<IUserWorkoutAssignmentRepository, UserWorkoutAssignmentRepository>();
builder.Services.AddScoped<IBodyMeasurementRepository, BodyMeasurementRepository>();
builder.Services.AddSingleton<JwtService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Origens liberadas: localhost (desenvolvimento) + as do ambiente publicado,
// separadas por vírgula na variável Cors__Origins (ex.: "https://fitmob.vercel.app,https://fitmob-admin.vercel.app")
var corsOrigins = new[] { "http://localhost:4200", "https://localhost:4200", "http://localhost:4300", "https://localhost:4300", "http://localhost:5017" }
    .Concat((builder.Configuration["Cors:Origins"] ?? "")
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(o => o.TrimEnd('/')))
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Hospedagem (Render, Railway...): o HTTPS termina no proxy; estes cabeçalhos dizem à API que a chamada veio por HTTPS
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// DB init + seed admin
var connectionString = DbConnectionFactory.Resolve(builder.Configuration);
try
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();
    await conn.ExecuteAsync(SqlScripts.CreateTables);

    // Admin padrão. Em desenvolvimento a senha é sempre "admin123" (resetada a cada início).
    // Publicado: a senha vem de Admin__Password e NUNCA é resetada; sem a variável, nenhum admin é criado.
    var adminExists = await conn.ExecuteScalarAsync<bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@fittech.com')");
    var isDev = app.Environment.IsDevelopment();
    var adminPassword = builder.Configuration["Admin:Password"] ?? (isDev ? "admin123" : null);

    if (!adminExists && adminPassword is not null)
    {
        await conn.ExecuteAsync(
            "INSERT INTO users (name, email, password_hash, role, is_active) VALUES ('Admin', 'admin@fittech.com', @Hash, 'admin', true)",
            new { Hash = BCrypt.Net.BCrypt.HashPassword(adminPassword) });
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine(isDev ? "Admin criado: admin@fittech.com / admin123" : "Admin criado: admin@fittech.com (senha de Admin__Password)");
        Console.ResetColor();
    }
    else if (adminExists && isDev)
    {
        await conn.ExecuteAsync(
            "UPDATE users SET password_hash = @Hash, is_active = true WHERE email = 'admin@fittech.com'",
            new { Hash = BCrypt.Net.BCrypt.HashPassword(adminPassword!) });
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("Senha do admin resetada para: admin123");
        Console.ResetColor();
    }
    else if (!adminExists)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("Nenhum admin criado: defina a variável Admin__Password para criar admin@fittech.com.");
        Console.ResetColor();
    }

    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine("✔ Banco de dados inicializado com sucesso.");
    Console.ResetColor();
}
catch (Exception ex)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine($"✘ Falha ao inicializar banco de dados: {ex.Message}");
    Console.ResetColor();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseForwardedHeaders();
app.UseCors();
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
