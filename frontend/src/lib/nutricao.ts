const umaCasa = (valor: number) => Math.round(valor * 10) / 10;

/** Calorias derivadas dos macros: 4 kcal/g de carboidrato e proteína, 9 kcal/g de gordura. */
export function calorasDeMacros(
  carboidrato_g: number,
  proteina_g: number,
  gordura_g: number,
): number {
  return umaCasa(4 * carboidrato_g + 4 * proteina_g + 9 * gordura_g);
}
