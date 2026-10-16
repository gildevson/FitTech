using Npgsql;
using System.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration configuration)
    {
        _connectionString = Resolve(configuration)
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    public IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    /// <summary>
    /// Connection string do banco: ConnectionStrings:DefaultConnection ou a variável DATABASE_URL.
    /// Aceita o formato de URL que Neon/Render/Railway mostram (postgresql://usuario:senha@host/banco).
    /// </summary>
    public static string? Resolve(IConfiguration configuration)
    {
        var value = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(value)) value = configuration["DATABASE_URL"];
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.StartsWith("postgres://") || value.StartsWith("postgresql://") ? FromUrl(value) : value;
    }

    private static string FromUrl(string url)
    {
        var uri = new Uri(url);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
            // Bancos na nuvem exigem conexão criptografada
            SslMode = SslMode.Require
        };
        return builder.ConnectionString;
    }
}
