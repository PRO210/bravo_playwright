import 'dotenv/config';
import { chromium } from 'playwright';
import LoginPage from './pages/LoginPage.js';
import { buscarEGerenciarAlunos } from './services/alunoService.js';
import { saveAuthData, loadAuthData } from './utils/authUtils.js';
import { GerenciadorAlunosCsv } from './services/GerenciadorAlunosCsv.js';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: null,
    screen: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const urlLogin = 'https://web02.sipf.com.br/sipfalpha/Login/Index/pesqueirape';
  await page.goto(urlLogin);
  await page.waitForTimeout(3000);



  console.log('Clicando em "Acessar o Sistema"...');
  await page.click('text="CLIQUE AQUI PARA ACESSAR"');
  await page.waitForTimeout(3000);

  const login = process.env.LOGIN;
  const senha = process.env.SENHA;

  /* Instacinar os objetos */
  const loginPage = new LoginPage(page);
  const gerenciadorAlunosCsv = new GerenciadorAlunosCsv(page, './alunos.csv');

  console.log('Fazendo login manual...');
  await loginPage.login(login, senha);
  await loginPage.aceitarCookiesSeExiste();

  const cookies = await context.cookies();
  if (cookies.length > 0) {
    await saveAuthData({ cookies });
  } else {
    console.warn('Nenhum cookie foi encontrado após o login.');
  }

  await gerenciadorAlunosCsv.executar();




  await page.pause();
  // await browser.close();
})();
