using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddSingleton<DbConnectionFactory>();
builder.Services.AddScoped<IMuscleGroupRepository, MuscleGroupRepository>();
builder.Services.AddScoped<IExerciseRepository, ExerciseRepository>();
builder.Services.AddScoped<IWorkoutPlanRepository, WorkoutPlanRepository>();
builder.Services.AddScoped<IWorkoutRepository, WorkoutRepository>();
builder.Services.AddScoped<IWorkoutExerciseRepository, WorkoutExerciseRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
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

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200", "http://localhost:4300", "https://localhost:4300")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// DB init + seed admin
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
try
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();
    await conn.ExecuteAsync(SqlScripts.CreateTables);

    // Seed default admin
    var adminExists = await conn.ExecuteScalarAsync<bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@fittech.com')");
    var resetHash = BCrypt.Net.BCrypt.HashPassword("admin123");
    if (!adminExists)
    {
        await conn.ExecuteAsync(
            "INSERT INTO users (name, email, password_hash, role, is_active) VALUES ('Admin', 'admin@fittech.com', @Hash, 'admin', true)",
            new { Hash = resetHash });
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("Admin criado: admin@fittech.com / admin123");
        Console.ResetColor();
    }
    else
    {
        await conn.ExecuteAsync(
            "UPDATE users SET password_hash = @Hash, is_active = true WHERE email = 'admin@fittech.com'",
            new { Hash = resetHash });
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("Senha do admin resetada para: admin123");
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

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
