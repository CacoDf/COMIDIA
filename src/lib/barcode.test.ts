import { isValidGtin, StableReader } from './barcode';

test.each([
  ['7802900004873', true],   // EAN-13 real del laboratorio
  ['7802900004874', false],  // dígito verificador malo
  ['0842804004873', true],   // lectura falsa del laboratorio: pasa el verificador, por eso hace falta lectura estable
  ['5449000000996', true],
  ['036000291452', true],    // UPC-A
  ['96385074', true],        // EAN-8
  ['12345', false],
  ['78029000048a3', false],
])('isValidGtin(%s) = %s', (code, ok) => {
  expect(isValidGtin(code)).toBe(ok);
});

test('StableReader acepta un código solo tras 3 lecturas iguales seguidas', () => {
  const r = new StableReader(3);
  expect(r.push('7802900004873')).toBeNull();
  expect(r.push('7802900004873')).toBeNull();
  expect(r.push('7802900004873')).toBe('7802900004873');
});

test('StableReader reinicia con una lectura distinta', () => {
  const r = new StableReader(3);
  r.push('7802900004873');
  r.push('7802900004873');
  expect(r.push('0842804004873')).toBeNull();
  expect(r.push('7802900004873')).toBeNull();
});

test('StableReader ignora códigos inválidos', () => {
  const r = new StableReader(2);
  r.push('7802900004873');
  expect(r.push('7802900004874')).toBeNull();
  expect(r.push('7802900004873')).toBeNull();
  expect(r.push('7802900004873')).toBe('7802900004873');
});

test('StableReader no repite el mismo código ya aceptado hasta que cambie', () => {
  const r = new StableReader(2);
  r.push('5449000000996');
  expect(r.push('5449000000996')).toBe('5449000000996');
  expect(r.push('5449000000996')).toBeNull();
  expect(r.push('5449000000996')).toBeNull();
  r.reset();
  r.push('5449000000996');
  expect(r.push('5449000000996')).toBe('5449000000996');
});
