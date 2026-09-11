import type { EntradaPerfil, FaixaRefeicao, Objetivo, Perfil, Sexo } from '../lib/types';

export interface Formulario {
  nome: string;
  sexo: '' | Sexo;
  idade: string;
  peso_kg: string;
  altura_cm: string;
  objetivo: Objetivo;
  meta_calorias: string;
  meta_carboidrato_g: string;
  meta_proteina_g: string;
  meta_gordura_g: string;
  meta_agua_ml: string;
  metas_automaticas: boolean;
  modo_preguicoso: boolean;
  faixas_refeicao: FaixaRefeicao[];
  timezone: string;
}

export function paraFormulario(perfil: Perfil): Formulario {
  return {
    nome: perfil.nome,
    sexo: perfil.sexo ?? '',
    idade: perfil.idade === null ? '' : String(perfil.idade),
    peso_kg: perfil.peso_kg === null ? '' : String(perfil.peso_kg),
    altura_cm: perfil.altura_cm === null ? '' : String(perfil.altura_cm),
    objetivo: perfil.objetivo,
    meta_calorias: String(perfil.meta_calorias),
    meta_carboidrato_g: String(perfil.meta_carboidrato_g),
    meta_proteina_g: String(perfil.meta_proteina_g),
    meta_gordura_g: String(perfil.meta_gordura_g),
    meta_agua_ml: String(perfil.meta_agua_ml),
    metas_automaticas: perfil.metas_automaticas,
    modo_preguicoso: perfil.modo_preguicoso,
    faixas_refeicao: perfil.faixas_refeicao,
    timezone: perfil.timezone,
  };
}

function numeroOuNulo(texto: string): number | null {
  const limpo = texto.trim().replace(',', '.');
  if (limpo === '') return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

export function paraEntrada(form: Formulario): EntradaPerfil {
  const entrada: EntradaPerfil = {
    nome: form.nome.trim(),
    sexo: form.sexo === '' ? null : form.sexo,
    idade: numeroOuNulo(form.idade),
    peso_kg: numeroOuNulo(form.peso_kg),
    altura_cm: numeroOuNulo(form.altura_cm),
    objetivo: form.objetivo,
    metas_automaticas: form.metas_automaticas,
    modo_preguicoso: form.modo_preguicoso,
    faixas_refeicao: form.faixas_refeicao,
    timezone: form.timezone.trim(),
  };
  // Com metas automáticas o backend recalcula; não faz sentido mandar valores manuais.
  if (!form.metas_automaticas) {
    entrada.meta_calorias = numeroOuNulo(form.meta_calorias) ?? 0;
    entrada.meta_carboidrato_g = numeroOuNulo(form.meta_carboidrato_g) ?? 0;
    entrada.meta_proteina_g = numeroOuNulo(form.meta_proteina_g) ?? 0;
    entrada.meta_gordura_g = numeroOuNulo(form.meta_gordura_g) ?? 0;
    entrada.meta_agua_ml = numeroOuNulo(form.meta_agua_ml) ?? 0;
  }
  return entrada;
}
