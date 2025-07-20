// pages/LoginPage.js
export default class LoginPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async goto(url) {
    await this.page.goto(url);
  }

  async login(login, senha) {
    await this.page.waitForSelector('input[name="login"]');
    await this.page.fill('input[name="login"]', login);
    await this.page.click('#botao-validar');
    await this.page.waitForTimeout(3000);

    await this.page.waitForSelector('input[name="senha"]');
    await this.page.fill('input[name="senha"]', senha);
    await this.page.click('#botao-acessar');
    await this.page.waitForTimeout(3000);

    await this.page.locator('button[type="submit"]', { hasText: 'ACESSAR' }).click();
    await this.page.waitForTimeout(3000);
  }

  async aceitarCookiesSeExiste() {
    const cookieBanner = await this.page.$('text=/cookies|aceitar|autorizar/i');
    if (cookieBanner) {
      await cookieBanner.click();
      await this.page.waitForTimeout(1000);
    }
  }
}
