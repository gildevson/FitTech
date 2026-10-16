public interface IDietRepository
{
    Task<IEnumerable<DietResponseDto>> GetAllAsync();
    Task<DietResponseDto?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(Diet diet);
    Task<bool> DeleteAsync(Guid id);
}
