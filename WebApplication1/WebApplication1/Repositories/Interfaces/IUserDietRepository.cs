public interface IUserDietRepository
{
    Task AssignAsync(Guid userId, Guid dietId);
    Task<IEnumerable<Guid>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<DietResponseDto>> GetDietsByUserIdAsync(Guid userId);
}
