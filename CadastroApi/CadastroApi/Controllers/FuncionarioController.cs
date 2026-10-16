using CadastroApi.Models;
using CadastroApi.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace CadastroApi.Controllers {
    [ApiController] // atributos usam colchetes
    [Route("api/[controller]")]
    public class FuncionarioController : ControllerBase // herda de ControllerBase
    {
        private readonly FuncionarioService _funcionarioService;

        public FuncionarioController(FuncionarioService funcionarioService) {
            _funcionarioService = funcionarioService;
        }

        private static readonly List<Funcionario> funcionarios = new List<Funcionario>();

        [HttpGet]
        public IActionResult Get() {
            return Ok(funcionarios);
        }

        [HttpPost]
        public IActionResult Post(Funcionario funcionario) {
            funcionarios.Add(funcionario);
            return Ok(funcionarios);
        }

        [HttpPut("{Id}/aumentar-salario")]
        public IActionResult AumentarSalario(int Id, decimal porcentagem) {
            var funcionario = funcionarios.FirstOrDefault(f => f.Id == Id);

            if (funcionario == null) {
                return NotFound("Funcionário não encontrado.");
            }

            _funcionarioService.AumentarSalario(funcionario, porcentagem);

            return Ok(funcionario);
        }
    }
}