import fs from 'fs/promises'; // Importe a versão de promessas do fs
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';

// Importe a funções de preenchimento de dados
import { preencherCPF } from '../services/preencherCPF.js';
import { preencherInep } from './preencherInep.js';
// import { preencherNIS } from '../services/preencherNIS.js'; // Ative se necessário

/**
 * @typedef {Object} AlunoCSV
 * @property {string} NomeDoAluno
 * @property {string} CPF
 * @property {string} [NIS] // Opcional, se você tiver NIS no CSV
 */

/**
 * Classe responsável por gerenciar alunos com base em um arquivo CSV.
 */
export class GerenciadorAlunosCsv {
  /**
   * @param {import('playwright').Page} page - Instância da página Playwright autenticada.
   * @param {string} [csvPath='./alunos.csv'] - Caminho para o arquivo CSV com os dados dos alunos.
   */
  constructor(page, csvPath = './alunos.csv') {
    this.page = page;
    this.csvPath = csvPath;

    /** @type {AlunoCSV[]} */
    this.alunosData = []; // Armazena os dados lidos do CSV

    /** @type {string[]} */
    this.alunosNaoEncontrados = []; // Nomes dos alunos que não foram encontrados na busca.

    /** @type {{ nome: string, mensagem: string }[]} */
    this.errosGeraisNoProcessamento = []; // Erros inesperados que não são "aluno não encontrado".
  }

  /**
   * Lê e retorna os registros do CSV como objetos.
   * @returns {Promise<Array<AlunoCSV>>} Uma promessa que resolve para um array de objetos AlunoCSV.
   */
  async lerRegistrosCSV() {
    // Para 'createReadStream', é melhor usar o módulo 'fs' padrão, não 'fs/promises' diretamente.
    // Assim, importamos 'fs' separadamente apenas para esta função.
    const fsOriginal = await import('fs');

    const parser = fsOriginal
      .createReadStream(this.csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }));

    for await (const record of parser) {
      this.alunosData.push(record);
    }
    console.log(`📄 ${this.alunosData.length} registros lidos do CSV: ${this.csvPath}`);

    return this.alunosData;
  }

  /**
   * Processa todos os alunos lidos do CSV em sequência.
   */
  async processarTodosAlunos() {
    console.log(`📄 Total de alunos: ${this.alunosData.length}`);
    console.log(`👥 Alunos: ${this.alunosData.map(r => r.NomeDoAluno).join(', ')}`);

    for (let i = 0; i < this.alunosData.length; i++) {
      try {
        // Chamamos processarAluno, passando o aluno e o índice
        // await this.processarAluno(this.alunosData[i], i);

        let NomeDoAluno = this.alunosData[i].NomeDoAluno;
        let MAE = this.alunosData[i].MAE || '';
        let NASC = this.alunosData[i].NASC || '';

        await preencherInep(NomeDoAluno, MAE, NASC, this.page)

      } catch (erroAluno) {
        // Este catch pega erros inesperados lançados por processarAluno que não são tratados internamente.
        const nome = this.alunosData[i].NomeDoAluno;
        console.error(`❌ Erro crítico com "${nome}": ${erroAluno.message}`);
        this.errosGeraisNoProcessamento.push({ nome, mensagem: erroAluno.message });
      }
    }
    // Após tentar processar todos os alunos, salva o log de não encontrados.
    await this.salvarAlunosNaoEncontradosLog();
  }

  /**
   * Tenta localizar, abrir e preencher dados de um aluno específico na página.
   * @param {AlunoCSV} aluno - Objeto com dados do aluno.
   * @param {number} indice - Índice do aluno no array de dados (para fins de log).
   */
  async processarAluno(aluno, indice) {
    const { NomeDoAluno, CPF } = aluno;
    const total = this.alunosData.length; // Pega o total de alunos do array da classe.

    console.log(`\n[${indice + 1}/${total}] Processando aluno: ${NomeDoAluno}`);

    const urlInicial = 'https://web02.sipf.com.br/sipfalpha/Aluno/Index/1';
    await this.page.goto(urlInicial, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle'); // Espera a rede ficar inativa para garantir que a página carregou.

    const inputBusca = 'input[type="search"].form-control.input-sm[aria-controls="listar-alunos-escola"]';
    await this.page.waitForSelector(inputBusca);
    await this.page.fill(inputBusca, NomeDoAluno);
    await this.page.waitForLoadState('networkidle'); // Espera a busca ser concluída e a tabela atualizada.

    // Seletores para o link "Gerenciar" e para a mensagem de "nenhum registro encontrado".
    const gerenciarSelector = `//td[contains(text(), "${NomeDoAluno}")]/following-sibling::td/a[contains(@href, "/Pessoa/Gerenciar/") and contains(@class, "btn-info")]`;
    const noRecordsSelector = 'td.dataTables_empty:has-text("No matching records found")';

    try {
      // Tenta encontrar o link "Gerenciar" com um timeout reduzido.
      const linkGerenciar = await this.page.waitForSelector(gerenciarSelector, { timeout: 5000 });
      const href = await linkGerenciar.getAttribute('href');
      console.log(`→ Link de gerenciamento encontrado: ${href}`);

      await linkGerenciar.click();
      await this.page.waitForLoadState('domcontentloaded'); // Espera a navegação para a página de gerenciamento.

      // Preenche o CPF (e NIS, se aplicável) usando as funções auxiliares.
      // await preencherCPF(this.page, CPF);
      // if (aluno.NIS) {
      //   await preencherNIS(this.page, aluno.NIS);
      // }

    } catch (error) {
      // Se o 'waitForSelector' para o link "Gerenciar" falhou (provavelmente por timeout),
      // verificamos se a mensagem de "nenhum registro" está visível.
      const noRecordsFound = await this.page.isVisible(noRecordsSelector);

      if (noRecordsFound) {
        console.log(`⚠ Nenhum registro encontrado para o aluno: ${NomeDoAluno}. Pulando para o próximo.`);
        // Adiciona o nome do aluno à lista de não encontrados.
        this.alunosNaoEncontrados.push(NomeDoAluno);
        // Não lançamos erro aqui, apenas registramos e permitimos que a função continue para o próximo aluno.
      } else {
        // Se não foi a mensagem de "nenhum registro", é um erro inesperado.
        console.error(`❌ Erro inesperado ao processar o aluno ${NomeDoAluno}:`, error);
        // Lança o erro para que o 'try-catch' em 'processarTodosAlunos' possa capturá-lo e registrar em 'errosGeraisNoProcessamento'.
        throw error;
      }
    }

    // Lógica para retornar à lista de alunos, se não for o último aluno.
    // Usamos 'total > 0' para garantir que há pelo menos um item na lista.
    if (indice < total - 1 && total > 0) {
      console.log('↩️ Retornando para lista de alunos...');
      await this.page.goBack();
      await this.page.waitForLoadState('domcontentloaded'); // Espera a página de lista carregar novamente.
    }
  }

  /**
   * Salva a lista de alunos não encontrados em um arquivo de log.
   */
  async salvarAlunosNaoEncontradosLog() {
    if (this.alunosNaoEncontrados.length === 0) {
      console.log('\n✅ Nenhum aluno não encontrado para registrar.');
      return;
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logPath = path.join(__dirname, 'alunos_nao_encontrados.log');
    const conteudo = this.alunosNaoEncontrados.join('\n');

    try {
      // Usamos fs.writeFile de 'fs/promises' que aceita a codificação como terceiro argumento.
      await fs.writeFile(logPath, conteudo, 'utf8');
      console.log(`\n⚠️ ${this.alunosNaoEncontrados.length} alunos não encontrados salvos em: ${logPath}`);
    } catch (writeError) {
      console.error(`\n❌ Erro ao tentar salvar o log de alunos não encontrados:`, writeError);
    }
  }

  /**
   * Salva os erros gerais encontrados durante o processamento em um arquivo de log.
   */
  async salvarErrosGeraisLog() {
    if (this.errosGeraisNoProcessamento.length === 0) return;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const erroPath = path.join(__dirname, 'erros_gerais_processamento.log');
    const conteudo = this.errosGeraisNoProcessamento.map(e => `[${e.nome}] - ${e.mensagem}`).join('\n');

    try {
      await fs.writeFile(erroPath, conteudo, 'utf8');
      console.log(`\n⚠️ ${this.errosGeraisNoProcessamento.length} erros gerais de processamento salvos em: ${erroPath}`);
    } catch (writeError) {
      console.error(`\n❌ Erro ao tentar salvar o arquivo de log de erros gerais:`, writeError);
    }
  }

  /**
   * Executa o fluxo completo de leitura do CSV e processamento dos alunos.
   */
  async executar() {
    console.log('🚀 Iniciando automação de gerenciamento de alunos...');

    try {
      await this.lerRegistrosCSV(); // Popula this.alunosData
      await this.processarTodosAlunos(); // Processa os alunos e preenche this.alunosNaoEncontrados e this.errosGeraisNoProcessamento

      console.log('\n✅ Processamento finalizado.');
      await this.salvarAlunosNaoEncontradosLog(); // Salva a lista de alunos não encontrados
      await this.salvarErrosGeraisLog(); // Salva os erros gerais de processamento
    } catch (erroGeral) {
      console.error('❌ Erro fatal na automação:', erroGeral.message);
      // Se um erro fatal ocorrer antes mesmo de iniciar o processamento de alunos, registre-o.
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const fatalErrorPath = path.join(__dirname, 'erro_fatal_automacao.log');
      await fs.writeFile(fatalErrorPath, `Erro fatal: ${erroGeral.message}\n${erroGeral.stack}`, 'utf8')
        .catch(console.error); // Lida com erro ao escrever o log fatal
    }
  }


}