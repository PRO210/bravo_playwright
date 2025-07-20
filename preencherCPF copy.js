/**
 * Preenche o campo CPF de um aluno e salva.
 * @param {object} page - Instância da página Playwright autenticada.
 * @param {string} cpfSujo - O número do CPF (pode conter pontos, traços etc.).
 */
async function preencherCPF(page, cpfSujo) {
  try {
    const cpf = cpfSujo.replace(/\D/g, '').slice(0, 11);
    if (!/^\d{11}$/.test(cpf)) {
      console.warn(`⚠️ CPF inválido: "${cpfSujo}" → "${cpf}"`);
      return;
    }

    console.log('[PASSO A] Acessando a aba "Documentos"...');
    await page.click('a:has-text("Documentos")');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    console.log('[PASSO B] Acessando a seção "CPF - Cadastro de Pessoa Física"...');
    const cpfBtn = await page.getByText('CPF - Cadastro de Pessoa Física', { exact: true });
    await cpfBtn.scrollIntoViewIfNeeded();
    await cpfBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    console.log(`[PASSO C] Preenchendo o CPF: ${cpf}`);
    const inputSelector = 'input[name="cpf_cpf"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.fill(inputSelector, cpf);


    console.log('[PASSO D] Salvando...');
    await page.click('button.btn-successfeed:has-text("SALVAR")');
    await page.waitForTimeout(3000);


    const feedback = await page.$('div.howl-message-inner');
    const msg = feedback ? await feedback.innerText() : '';
    if (msg.toLowerCase().includes('sucesso')) {
      console.log('[✅] CPF salvo com sucesso. Retornando à Pasta do Usuário...');
      await page.click('a:has-text("Pasta do Usuário")');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    } else {
      console.warn(`[⚠️] Mensagem inesperada ao salvar: "${msg}"`);
    }

  } catch (erro) {
    console.error('❌ Erro ao preencher o CPF:', erro.message);
  }
}

module.exports = { preencherCPF };
