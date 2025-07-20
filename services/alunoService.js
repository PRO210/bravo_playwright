import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { preencherCPF } from '../services/preencherCPF.js';
// import { preencherNIS } from '../services/preencherNIS.js'; // se necessário

/**
 * Lê e retorna os registros do CSV como objetos.
 * @param {string} filePath - Caminho do CSV
 * @returns {Promise<Array<Object>>}
 */
async function lerRegistrosCSV(filePath) {
  const registros = [];
  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({ columns: true, skip_empty_lines: true }));

  for await (const record of parser) {
    registros.push(record);
  }

  return registros;
}

/**
 * Tenta localizar, abrir e preencher dados de um aluno.
 * @param {import('playwright').Page} page
 * @param {Object} aluno
 * @param {number} indice
 * @param {number} total
 */
async function processarAluno(page, aluno, indice, total) {
  const { NomeDoAluno, CPF } = aluno;
  console.log(`\n[${indice + 1}/${total}] Processando aluno: ${NomeDoAluno}`);

  const urlInicial = 'https://web02.sipf.com.br/sipfalpha/Aluno/Index/1';
  await page.goto(urlInicial, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const inputBusca = 'input[type="search"].form-control.input-sm[aria-controls="listar-alunos-escola"]';
  await page.waitForSelector(inputBusca, { timeout: 10000 });
  await page.fill(inputBusca, NomeDoAluno);
  await page.waitForTimeout(3000);

  const gerenciarSelector = `//td[contains(text(), "${NomeDoAluno}")]/following-sibling::td/a[contains(@href, "/Pessoa/Gerenciar/") and contains(@class, "btn-info")]`;
  const linkGerenciar = await page.waitForSelector(gerenciarSelector, { timeout: 10000 });

  const href = await linkGerenciar.getAttribute('href');
  console.log(`→ Link de gerenciamento encontrado: ${href}`);
  await linkGerenciar.click();
  await page.waitForTimeout(3000);

  // Funções auxiliares de preenchimento
  await preencherCPF(page, CPF);
  // await preencherNIS(page, aluno.NIS);

  // Voltar para lista se houver mais alunos
  if (indice < total - 1 && total > 1) {
    console.log('↩️ Retornando para lista de alunos...');
    await page.goBack();
    await page.waitForTimeout(3000);
  }
}

/**
 * Salva os erros encontrados durante o processamento em um arquivo log.
 * @param {Array<{ nome: string, mensagem: string }>} erros
 */
async function salvarErrosEmLog(erros) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const erroPath = path.join(__dirname, 'erros_alunos.log');
  const conteudo = erros.map(e => `[${e.nome}] - ${e.mensagem}`).join('\n');

  await fs.promises.writeFile(erroPath, conteudo, 'utf8');
  console.log(`\n⚠️ ${erros.length} erros salvos em: erros_alunos.log`);
}

/**
 * Realiza a busca e preenchimento de dados de alunos com base no CSV.
 * 
 * @param {string} csvFilePath - Caminho para o CSV de alunos.
 * @param {import('playwright').Page} page - Página Playwright autenticada.
 */
export async function buscarEGerenciarAlunos(csvFilePath, page) {
  console.log('🚀 Iniciando automação de gerenciamento de alunos...');

  const erros = [];

  try {
    const registros = await lerRegistrosCSV(csvFilePath);
    const total = registros.length;

    console.log(`📄 Total de alunos: ${total}`);
    console.log(`👥 Alunos: ${registros.map(r => r.NomeDoAluno).join(', ')}`);

    for (let i = 0; i < total; i++) {
      const aluno = registros[i];

      try {
        await processarAluno(page, aluno, i, total);
      } catch (erroAluno) {
        console.error(`❌ Erro com "${aluno.NomeDoAluno}": ${erroAluno.message}`);
        erros.push({ nome: aluno.NomeDoAluno, mensagem: erroAluno.message });
      }
    }

    console.log('\n✅ Processamento finalizado.');
    if (erros.length > 0) {
      await salvarErrosEmLog(erros);
    }

  } catch (erroGeral) {
    console.error('❌ Erro geral na automação:', erroGeral.message);
  }
}
