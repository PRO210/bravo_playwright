const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');
const { preencherNIS } = require('./preencherNis');
const { preencherCPF } = require('./preencherCPF');

/**
 * Realiza a busca e gerenciamento de alunos a partir de um arquivo CSV.
 * @param {string} csvFilePath - O caminho para o arquivo CSV.
 * @param {object} page - Página Playwright já autenticada.
 */
async function buscarEGerenciarAlunos(csvFilePath, page) {
  console.log('Iniciando automação de busca de alunos...');

  try {
    const registrosAlunos = [];
    const erros = []; // 👈 Lista de erros por aluno

    const parser = fs
      .createReadStream(csvFilePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }));


    for await (const record of parser) {
      registrosAlunos.push(record); // salva linha completa
    }

    const totalAlunos = registrosAlunos.length;
    console.log(`Total de alunos a processar: ${totalAlunos}`);
    console.log(`Nomes carregados: ${registrosAlunos.map(r => r.NomeDoAluno).join(', ')}`);

    for (let i = 0; i < totalAlunos; i++) {

      const record = registrosAlunos[i]; // 👈 agora está disponível aqui
      const nomeAluno = record.NomeDoAluno;

      console.log(`\n[${i + 1}/${totalAlunos}] Processando aluno: ${nomeAluno}`);

      try {
        const urlInicial = 'https://web02.sipf.com.br/sipfalpha/Aluno/Index/1';
        await page.goto(urlInicial, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const inputBuscaSelector = 'input[type="search"].form-control.input-sm[aria-controls="listar-alunos-escola"]';
        await page.waitForSelector(inputBuscaSelector, { timeout: 10000 });
        await page.fill(inputBuscaSelector, nomeAluno);
        await page.waitForTimeout(3000);

        const gerenciarLinkSelector = `//td[contains(text(), "${nomeAluno}")]/following-sibling::td/a[contains(@href, "/Pessoa/Gerenciar/") and contains(@class, "btn-info")]`;
        const gerenciarLink = await page.waitForSelector(gerenciarLinkSelector, { timeout: 10000 });

        const href = await gerenciarLink.getAttribute('href');
        console.log(`[PASSO 3] Gerenciar aluno encontrado: ${href}`);
        await gerenciarLink.click();
        await page.waitForTimeout(3000);


        // await preencherNIS(page, record.NIS);

        // await preencherCPF(page, record.CPF);

        if (i < totalAlunos - 1 && totalAlunos > 1) {
          console.log(`[INFO] Retornando para lista para o próximo aluno...`);
          await page.goBack();
          await page.waitForTimeout(3000);
        }
      } catch (erroAluno) {
        console.error(`❌ Erro ao processar "${nomeAluno}": ${erroAluno.message}`);
        erros.push({ nome: nomeAluno, mensagem: erroAluno.message });
      }
    }

    console.log('\n✅ Automação finalizada.');

    // Se houver erros, salva em arquivo
    if (erros.length > 0) {
      const erroPath = path.join(__dirname, 'erros_alunos.log');
      const linhas = erros.map(e => `[${e.nome}] - ${e.mensagem}`).join('\n');

      fs.writeFileSync(erroPath, linhas, 'utf8');
      console.log(`\n⚠️ Erros encontrados em ${erros.length} alunos. Detalhes salvos em: erros_alunos.log`);
    }

  } catch (error) {
    console.error('❌ Erro na automação geral:', error);
  }
}

module.exports = { buscarEGerenciarAlunos };
