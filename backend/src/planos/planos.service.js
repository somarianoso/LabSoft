export function createPlanosService(repository) {
  return {
    listar: () => repository.listarAtivos(),
  };
}
