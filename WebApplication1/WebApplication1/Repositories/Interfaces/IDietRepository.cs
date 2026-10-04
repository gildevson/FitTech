public interface IDietRepository
{
    Task<IEnumerable<Diet>> GetAllAsync();
    Task<DietResponseDto?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(Diet diet);
    Task<bool> DeleteAsync(Guid id);
}
