/**
 * Classe representante da página de gerenciamento de alunos.
 */
export default class AlunosPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseUrl Base da URL da aplicação
   */
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
    // Define seletores específicos da página
    this.searchInput = page.locator('#searchAlunoInput');
    this.submitButtonText = (text) => page.locator(`button:has-text("${text}")`);
  }

  /**
   * Navega até a página de alunos.
   */
  async navigateToAlunosPage() {
    await this.page.goto(`${this.baseUrl}/alunos`, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Pesquisa um aluno pelo nome.
   * @param {string} nomeAluno
   */
  async searchAluno(nomeAluno) {
    await this.searchInput.fill(nomeAluno);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Verifica se o nome do aluno está visível na lista.
   * @param {string} nomeAluno
   * @returns {Promise<boolean>}
   */
  async isAlunoNameVisible(nomeAluno) {
    const alunoLocator = this.page.locator(`text=${nomeAluno}`);
    return await alunoLocator.isVisible();
  }

  /**
   * Clica no dropdown de ações para um aluno específico.
   * @param {string} nomeAluno
   */
  async clickAlunoActionDropdown(nomeAluno) {
    const dropdownLocator = this.page.locator(`tr:has-text("${nomeAluno}") >> button[aria-label="Ações"]`);
    await dropdownLocator.click();
  }

  /**
   * Clica em "Alterar Cadastro" no dropdown.
   */
  async clickAlterarCadastro() {
    const alterarCadastroBtn = this.page.locator('text=Alterar Cadastro');
    await alterarCadastroBtn.click();
  }

  /**
   * Preenche input pelo atributo name.
   * @param {string} inputName
   * @param {string} value
   */
  async fillInputByName(inputName, value) {
    const inputLocator = this.page.locator(`input[name="${inputName}"]`);
    await inputLocator.fill(value);
  }

  /**
   * Clica no botão baseado no texto do botão.
   * @param {string} textoBotao
   */
  async clickSubmitButtonByText(textoBotao) {
    const button = this.submitButtonText(textoBotao);
    await button.click();
  }

  /**
   * Confirma um alerta modal (exemplo simples).
   */
  async confirmAlert() {
    // Simplificado, adapte para seu alerta real.
    this.page.once('dialog', dialog => dialog.accept());
  }
}
