require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs/promises');
const { buscarEGerenciarAlunos } = require('./buscaAluno');



(async () => {
  const browser = await chromium.launch({ headless: false });
  // const context = await browser.newContext();

  // Defina o tamanho da janela (exemplo: 1920x1080)
  const context = await browser.newContext({
    viewport: null, // para usar o tamanho da janela
    screen: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  console.log('Acessando o site...');
  // await page.goto('https://school.proandre.com.br/');
  await page.goto('https://web02.sipf.com.br/sipfalpha/Login/Index/pesqueirape');
  // Aguarda 3 segundos antes da próxima ação
  await page.waitForTimeout(3000);

  console.log('Clicando em "Acessar o Sistema"...');
  await page.click('text="CLIQUE AQUI PARA ACESSAR"');
  // await page.click('text="Acessar o Sistema"');
  // Aguarda 3 segundos antes da próxima ação
  await page.waitForTimeout(3000);

  // Aguarda o formulário de login carregar (ajuste o seletor conforme o site)
  await page.waitForSelector('input[name="login"]');

  // Preencha com os dados padrão Laravel (exemplo)
  const login = process.env.LOGIN; // substitua pelo email real

  console.log('Preenchendo login . . .');
  await page.fill('input[name="login"]', login);

  // Clica no botão com id "botao-validar"
  await page.click('#botao-validar');

  // Aguarda 3 segundos antes da próxima ação
  await page.waitForTimeout(3000);

  console.log('Enviando formulário...');

  // Aguarda o formulário de senha carregar (ajuste o seletor conforme o site)
  await page.waitForSelector('input[name="senha"]');

  // Preencha com os dados padrão Laravel (exemplo)
  const senha = process.env.SENHA; // substitua pelo email real

  console.log('Preenchendo senha . . .');
  await page.fill('input[name="senha"]', senha);

  // Clica no botão com id "botao-acessar"
  await page.click('#botao-acessar');
  // Aguarda 3 segundos antes da próxima ação
  await page.waitForTimeout(3000);

  // Clica no botão com submit "com text='ACESSAR'"
  await page.locator('button[type="submit"]', { hasText: 'ACESSAR' }).click();
  // Aguarda 3 segundos antes da próxima ação
  await page.waitForTimeout(3000);

  // /* Início do cadastrar */
  // // 1. Acessar o endereço
  // await page.goto('https://web02.sipf.com.br/sipfalpha/Matriculasv2/Index/0/99');
  // console.log('Página carregada');
  // await page.waitForTimeout(3000); // espera 3 segundos

  // // 2. Clicar no link que abre o primeiro modal
  // const primeiroModalLink = page.locator('a[data-toggle="modal"][href="#nova_matriculav2"]');
  // await primeiroModalLink.click();
  // console.log('Cliquei no primeiro link para abrir o modal #nova_matriculav2');
  // await page.waitForTimeout(3000); // espera 3 segundos

  // // 3. Clicar no link que abre o segundo modal (ALUNO NOVO)
  // // O seletor busca o <a> que tenha href="#cadatrar_novomatr_alunov2" e data-toggle="modal"
  // // que contém o texto "ALUNO NOVO" dentro da div.caption
  // const alunoNovoLink = page.locator('a[href="#cadatrar_novomatr_alunov2"][data-toggle="modal"]', {
  //   has: page.locator('p:text("ALUNO NOVO")')
  // });

  // await alunoNovoLink.click();
  // console.log('Cliquei no link ALUNO NOVO para abrir o segundo modal');
  // await page.waitForTimeout(3000); // espera 3 segundos

  // // Preencher os campos
  // await page.fill('input[name="aluno-nome"]', 'NOME DO ALUNO');
  // await page.fill('input[name="mae-nome"]', 'NOME DA MÃE');
  // await page.fill('input[name="data-nasc"]', '2000-01-01'); // formato yyyy-mm-dd para input type=date
  // await page.fill('input[name="cpf"]', '12345678900');

  // // Clicar no botão "Verificar cadastro"
  // await page.click('#matricula-verificar-cadastro');

  // // Esperar um pouco para a resposta aparecer
  // await page.waitForTimeout(5000);

  // // Verificar se a mensagem de aluno já cadastrado apareceu
  // const existeCadastro = await page.isVisible('.alert.alert-info.msg-aluno-existe-matricula');

  // if (existeCadastro) {
  //   console.log('Aluno já possui cadastro. Retorne a etapa anterior.');
  // } else {
  //   // Caso contrário, clicar no botão "Continuar"
  //   await page.click('#matricula-cadastrar');
  //   console.log('Aluno não cadastrado. Continuando o processo.');
  // }
  // /* Fim  do cadastrar */



  // Verifica se há necessidade   de autorização de cookies e clica se existir


  const cookieBanner = await page.$('text=/cookies|aceitar|autorizar/i');
  if (cookieBanner) {
    console.log('Autorizando cookies...');
    await cookieBanner.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('Nenhuma autorização de cookies detectada.');
  }

  // Obtém cookies após login
  const cookies = await context.cookies();

  // Procura um cookie de autenticação (exemplo: laravel_session ou similar)
  const authCookie = cookies.find(c => c.name.toLowerCase().includes('laravel') || c.name.toLowerCase().includes('session'));

  if (authCookie) {
    console.log('Cookie de autenticação encontrado:', authCookie.name);
  } else {
    console.log('Cookie de autenticação não encontrado.');
  }

  // Salva login e cookie de autenticação em arquivo JSON separado
  const authData = {
    login,
    senha,
    authCookie: authCookie || null,
  };

  await fs.writeFile('authData.json', JSON.stringify(authData, null, 2));
  console.log('Dados de autenticação salvos em authData.json');

  await buscarEGerenciarAlunos('./alunos.csv', page);


  // await browser.close();
  await page.pause();
})();
// MARIA LORENA NUNES NASCIMENTO
