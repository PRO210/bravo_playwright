/**
 * Função para encontrar e interagir com o link "INFORMAR" de um aluno na lista de alunos dos sem INEP.
 *
 * @param {string} nomeDoAluno - O nome completo do aluno a ser buscado (usado apenas para logs).
 * @param {string} MAE - O nome completo da MÃE do aluno a ser buscado (critério principal de busca).
 * @param {string} NASC - Data de nascimento do aluno (não utilizada na lógica atual, mas mantida para conformidade com a assinatura original).
 * @param {import('playwright').Page} page - A instância da página principal do Playwright.
 * @returns {Promise<{status: string, mensagem: string}|null>} Um objeto com o status da operação e uma mensagem, ou null em caso de erro crítico inicial.
 */
export async function preencherInep(nomeDoAluno, MAE, NASC, page) {
  // Define as URLs e seletores utilizados na função
  const urlListaAlunos = 'https://web02.sipf.com.br/sipfalpha/Escolav3/Index/0/107';
  const vejaAListaSelector = 'a.btn.btn-danger.btn-block[href="https://web02.sipf.com.br/sipfalpha/Escolav3/Index/0/107"]';
  const tabelaAlunosSelector = '#DataTables_Table_0';

  console.log(`[PASSO 1/9] 🔎 Tentando acessar a lista de alunos para "${nomeDoAluno}" (mãe: "${MAE}")...`);

  try {
    // Tenta clicar no botão "VEJA A LISTA" para navegar até a página de listagem.
    console.log('[PASSO 2/9] Tentando clicar no botão "VEJA A LISTA"...');
    await page.click(vejaAListaSelector, { timeout: 5000 });
    // Aguarda o carregamento do DOM após o clique.
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ [PASSO 2/9] Botão "VEJA A LISTA" clicado com sucesso.');
  } catch (error) {
    // Se o botão não for encontrado ou houver erro no clique, navega diretamente para a URL da lista.
    console.warn('⚠️ [PASSO 2/9] Botão "VEJA A LISTA" não encontrado ou erro ao clicar. Navegando diretamente para a URL da lista...');
    await page.goto(urlListaAlunos, { waitUntil: 'domcontentloaded' });
  }

  // Garante que a tabela de alunos esteja presente na página antes de prosseguir.
  console.log('[PASSO 3/9] Aguardando o carregamento da tabela de alunos...');
  await page.waitForSelector(tabelaAlunosSelector);
  // Aguarda que a rede esteja inativa para garantir que todos os dados da tabela foram carregados.
  await page.waitForLoadState('networkidle');
  console.log('✅ [PASSO 3/9] Tabela de alunos carregada.');

  console.log(`[PASSO 4/9] Buscando aluno "${nomeDoAluno}" na tabela usando o nome da mãe: "${MAE}"...`);

  // Seletor XPath para encontrar o botão "INFORMAR" associado à mãe correta.
  // Ele busca uma célula de tabela (<td>) que contém um <strong> com o texto "Nome da mãe:"
  // E que, dentro dessa mesma <td>, contenha o nome da mãe específico.
  // Dentro dessa <td>, ele procura o link <a> com as classes 'btn-info' e o texto "INFORMAR".
  const linkInformarSelector = `//td[
    ./strong[contains(text(), "Nome da mãe:")] and
    ./text()[contains(., "${MAE}")]
  ]//a[contains(@class, "btn-info") and contains(text(), "INFORMAR")]`;

  let novaPagina; // Variável para a nova página/aba, declarada aqui para ser acessível no bloco catch.

  try {
    console.log(`[PASSO 5/9] Clicando no botão "INFORMAR" para o aluno com mãe "${MAE}" e aguardando nova aba...`);
    // Usa Promise.all para esperar por dois eventos simultaneamente:
    // 1. Abertura de uma nova página (aba/janela).
    // 2. O clique no link que dispara essa nova página.
    [novaPagina] = await Promise.all([
      page.context().waitForEvent('page'), // Espera por um evento de criação de nova 'page' (aba/janela).
      page.click(linkInformarSelector)     // Clica no link que dispara a abertura da nova aba.
    ]);

    console.log(`✔️ [PASSO 5/9] Nova janela/aba aberta com URL: ${novaPagina.url()}`);

    // É crucial esperar que a nova página carregue completamente antes de interagir com ela.
    console.log('[PASSO 6/9] Aguardando o carregamento completo da nova janela/aba...');
    await novaPagina.waitForLoadState('networkidle'); // Garante que todos os recursos foram carregados.
    console.log('✅ [PASSO 6/9] Nova janela/aba carregada completamente.');

    // --- AÇÕES NA NOVA JANELA/ABA ---
    // Este é o local onde você adicionaria a lógica para interagir com a nova página.
    // O código original tinha lógica comentada para preencher INEP e salvar.
    // Por exemplo, para preencher um campo e clicar em um botão:
    // console.log("Preenchendo campo INEP na nova janela...");
    // const inepInputSelector = 'input[name="registros_cod_inep"]';
    // await novaPagina.waitForSelector(inepInputSelector, { state: 'visible' });
    // await novaPagina.fill(inepInputSelector, INEP_DO_ALUNO); // Substitua INEP_DO_ALUNO pelo valor real
    // console.log(`INEP "${INEP_DO_ALUNO}" preenchido.`);

    // console.log("Clicando no botão 'SALVAR ALTERAÇÃO' na nova janela...");
    // const salvarButtonSelector = 'button[type="submit"].btn.btn-lg.btn-info:has-text("SALVAR ALTERAÇÃO")';
    // await novaPagina.waitForSelector(salvarButtonSelector, { state: 'visible' });
    // await novaPagina.click(salvarButtonSelector);
    // console.log("Botão 'SALVAR ALTERAÇÃO' clicado.");

    // Aguarda um tempo fixo (3 segundos) para qualquer processamento pós-interação na nova página.
    console.log('[PASSO 7/9] Aguardando 3 segundos para estabilização da nova página...');
    await novaPagina.waitForTimeout(3000);
    console.log('✅ [PASSO 7/9] Tempo de espera na nova página concluído.');

    // --- FECHAR A NOVA JANELA/ABA ---
    console.log('[PASSO 8/9] Fechando a nova janela/aba...');
    await novaPagina.close(); // Fecha a aba recém-aberta.
    console.log('✅ [PASSO 8/9] Nova janela/aba fechada.');

    console.log(`[PASSO 9/9] Retornou para a janela original: ${page.url()}`);
    return { status: 'sucesso', mensagem: 'Interação com detalhes do aluno concluída e janela fechada com sucesso.' };

  } catch (error) {
    console.error(`❌ [ERRO] Erro ao interagir com a nova janela para o aluno "${nomeDoAluno}" (mãe "${MAE}"). Erro: ${error.message}`);
    // Se a nova página foi aberta, mas houve um erro, tenta fechá-la para evitar abas órfãs.
    if (novaPagina && !novaPagina.isClosed()) {
      console.warn('[ERRO] Tentando fechar a nova janela/aba devido ao erro...');
      await novaPagina.close();
      console.warn('[ERRO] Nova janela/aba fechada após erro.');
    }
    return { status: 'erro', mensagem: error.message };
  }
}