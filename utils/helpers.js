/**
 * Preenche um campo de input se o valor existe e não está vazio.
 * @param {import('../pages/AlunosPage.js').default} alunosPage Instância da página de alunos
 * @param {string} campo Nome do campo para preencher
 * @param {string | undefined} valor Valor para preencher
 * @param {string} nomeAluno Nome do aluno para log personalizado
 */
export async function preencherCampoIfExists(alunosPage, campo, valor, nomeAluno) {
  if (valor?.trim()) {
    await alunosPage.fillInputByName(campo, valor);
  } else {
    console.log(`${campo} não fornecido no CSV para o aluno ${nomeAluno}. Pulando.`);
  }
}
