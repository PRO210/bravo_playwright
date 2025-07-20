import fs from 'fs';
import { parse } from 'csv-parse';

/**
 * Lê CSV e retorna array de objetos com dados do arquivo.
 * @param {string} filePath
 * @returns {Promise<Object[]>}
 */
export function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (row) => {
        results.push(row);
      })
      .on('error', (err) => reject(err))
      .on('end', () => resolve(results));
  });
}
