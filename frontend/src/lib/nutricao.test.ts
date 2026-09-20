import { describe, expect, it } from 'vitest';
import { calorasDeMacros } from './nutricao';

describe('calorasDeMacros', () => {
  it('calcula 4/4/9 a partir dos macros', () => {
    expect(calorasDeMacros(50, 20, 10)).toBe(370); // 200 + 80 + 90
  });

  it('devolve zero quando todos os macros são zero', () => {
    expect(calorasDeMacros(0, 0, 0)).toBe(0);
  });

  it('arredonda a 1 casa decimal', () => {
    expect(calorasDeMacros(10.5375, 0, 0)).toBe(42.2); // 4*10.5375 = 42.15 -> 42.2
  });
});
