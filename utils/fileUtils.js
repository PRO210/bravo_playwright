import fs from 'fs/promises';

/**
 * Salva um objeto como JSON em arquivo.
 * @param {string} filePath
 * @param {any} data
 */
export async function saveJson(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Arquivo salvo: ${filePath}`);
  } catch (error) {
    console.error(`Erro ao salvar arquivo ${filePath}: ${error.message}`);
  }
}
