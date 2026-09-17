import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { api, mensagemDoErro } from '../../lib/api';
import { paraEntrada, paraFormulario } from '../formularioPerfil';
import type { Formulario } from '../formularioPerfil';
import type { Perfil } from '../../lib/types';

export function useFormularioPerfil(inicial: Perfil) {
  const { definirPerfil } = useAuth();
  const [form, setForm] = useState<Formulario>(() => paraFormulario(inicial));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function mudar<C extends keyof Formulario>(campo: C, valor: Formulario[C]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar(): Promise<boolean> {
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await api.salvarPerfil(paraEntrada(form));
      definirPerfil(atualizado);
      setForm(paraFormulario(atualizado));
      return true;
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
      return false;
    } finally {
      setSalvando(false);
    }
  }

  return { form, mudar, salvar, salvando, erro, limparErro: () => setErro(null) };
}
