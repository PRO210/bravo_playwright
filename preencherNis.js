// preencherNis.js
async function preencherNIS(page, nisSujo) {

  const nis = nisSujo.replace(/\D/g, '').slice(0, 11);
  if (!/^\d{11}$/.test(nis)) {
    console.warn(`⚠️ NIS inválido: "${nisSujo}" → "${nis}"`);
    return;
  }

  try {
    console.log('[PASSO A] Acessando a aba "Documentos"...');
    await page.click('a:has-text("Documentos")');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    console.log('[PASSO B] Acessando a seção "PIS"...');
    const pisBtn = await page.waitForSelector('a.btn-info:has-text("PIS")', { timeout: 10000 });
    await pisBtn.scrollIntoViewIfNeeded(); // rola até o botão
    await pisBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);


    console.log(`[PASSO C] Preenchendo o campo de NIS: ${nis}`);
    const inputSelector = 'input[name="cadastro_tbfisicaspis_pispasep"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.fill(inputSelector, nis);

    console.log('[PASSO D] Salvando...');
    await page.click('button.btn-successfeed:has-text("SALVAR")');
    await page.waitForTimeout(3000);

    const feedback = await page.$('div.howl-message-inner');
    const msg = feedback ? await feedback.innerText() : '';
    console.log(`[PASSO E] Mensagem de feedback: "${msg}"`);

    if (msg.toLowerCase().includes('sucesso')) {
      console.log('[✅] NIS salvo com sucesso. Retornando à Pasta do Usuário...');
      await page.click('a:has-text("Pasta do Usuário")');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
    } else {
      console.warn(`[⚠️] Mensagem inesperada ao salvar: "${msg}"`);
    }

  } catch (erro) {
    console.error('❌ Erro ao preencher o NIS:', erro.message);
  }
}

module.exports = { preencherNIS };
