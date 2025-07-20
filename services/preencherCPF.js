/**
 * Preenche e salva o CPF de um aluno na seção "Documentos".
 *
 * @param {import('playwright').Page} page - Instância autenticada do Playwright.
 * @param {string} cpfSujo - CPF bruto (com ou sem pontuação).
 */
export async function preencherCPF(page, cpfSujo) {
  try {
    // 🔎 Limpa e valida o CPF
    const cpf = cpfSujo.replace(/\D/g, '').slice(0, 11);
    if (!/^\d{11}$/.test(cpf)) {
      console.warn(`⚠️ CPF inválido: "${cpfSujo}" → "${cpf}"`);
      return;
    }

    // 📁 Passo 1: Acessa a aba "Documentos"
    console.log('[1/5] Acessando a aba "Documentos"...');
    await page.click('a:has-text("Documentos")');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 🧾 Passo 2: Acessa a seção do CPF
    console.log('[2/5] Acessando "CPF - Cadastro de Pessoa Física"...');
    const cpfBtn = await page.getByText('CPF - Cadastro de Pessoa Física', { exact: true });
    await cpfBtn.scrollIntoViewIfNeeded();
    await cpfBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // ✍️ Passo 3: Preenche o CPF
    console.log(`[3/5] Preenchendo o campo CPF com: ${cpf}`);
    const inputSelector = 'input[name="cpf_cpf"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.fill(inputSelector, cpf);

    // 💾 Passo 4: Salva o CPF
    console.log('[4/5] Salvando dados...');
    await page.click('button.btn-successfeed:has-text("SALVAR")');
    await page.waitForTimeout(3000);

    // 📬 Passo 5: Verifica retorno do sistema
    const feedback = await page.$('div.howl-message-inner');
    const msg = feedback ? await feedback.innerText() : '';

    if (msg.toLowerCase().includes('sucesso')) {
      console.log('[✅] CPF salvo com sucesso.');
      console.log('[↩️] Retornando à "Pasta do Usuário"...');
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
