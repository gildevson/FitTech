// Campos de endereço compartilhados pelos DTOs de usuário
public abstract class UserAddressDto
{
    public string? ZipCode { get; set; }
    public string? Street { get; set; }
    public string? AddressNumber { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
}
