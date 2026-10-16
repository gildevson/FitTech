public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    // Endereço
    public string? ZipCode { get; set; }
    public string? Street { get; set; }
    public string? AddressNumber { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }

    // Idioma preferido no app (pt, en, es)
    public string? Language { get; set; }

    public void ApplyAddress(UserAddressDto dto)
    {
        static string? Clean(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();

        var zip = Clean(dto.ZipCode)?.Replace("-", "");
        ZipCode = zip is { Length: 8 } ? $"{zip[..5]}-{zip[5..]}" : zip;
        Street = Clean(dto.Street);
        AddressNumber = Clean(dto.AddressNumber);
        Complement = Clean(dto.Complement);
        Neighborhood = Clean(dto.Neighborhood);
        City = Clean(dto.City);
        State = Clean(dto.State)?.ToUpperInvariant();
    }
}
