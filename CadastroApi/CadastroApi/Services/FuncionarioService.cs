using CadastroApi.Models;

namespace CadastroApi.Services {
    public class FuncionarioService {
        public void AumentarSalario(Funcionario funcionario, decimal porcentagem) {
            funcionario.Salario += funcionario.Salario * porcentagem / 100;

        }
    }
}
