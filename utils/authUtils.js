import fs from 'fs/promises';
import 'dotenv/config';

const AUTH_FILE_PATH = 'authData.json';

export async function saveAuthData(authData) {
  try {
    await fs.writeFile(AUTH_FILE_PATH, JSON.stringify(authData, null, 2));
    console.log('Cookies salvos com sucesso em authData.json');
  } catch (error) {
    console.error('Erro ao salvar os cookies:', error);
  }
}

export async function loadAuthData() {
  try {
    const data = await fs.readFile(AUTH_FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);

    // 🔒 Verifica se os cookies possuem o campo necessário
    if (Array.isArray(parsed.cookies)) {
      parsed.cookies = parsed.cookies.map(cookie => {
        if (!cookie.domain && !cookie.url) {
          // Adiciona a URL base se estiver ausente (requerida pelo Playwright)
          cookie.url = 'https://web02.sipf.com.br';
        }
        return cookie;
      });
    }

    return parsed;
  } catch (error) {
    console.warn('authData.json não encontrado ou inválido. Login será feito manualmente.');
    return null;
  }
}
