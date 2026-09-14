import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TEXTO_STATUS, numero } from '../lib/format';
import type { PerfilPublico, ProgressoDia } from '../lib/types';

interface Props {
  perfil: PerfilPublico;
  progresso: ProgressoDia;
  /** Ação opcional à direita da linha (ex: "remover"). */
  children?: ReactNode;
}

/** Linha "nome#tag · 1.234 / 2.000 kcal" com a bolinha de status do dia. */
export default function ProgressoAmigo({ perfil, progresso, children }: Props) {
  return (
    <div className="linha-social">
      <Link
        className="linha-social-alvo"
        to={`/u/${perfil.id}`}
        aria-label={`${perfil.nome_tag} — ${numero(progresso.calorias)} de ${numero(
          progresso.meta_calorias,
        )} kcal hoje, ${TEXTO_STATUS[progresso.status]}`}
      >
        <span className={`ponto-status status-${progresso.status}`} aria-hidden="true" />
        <span className="linha-social-nome">{perfil.nome_tag}</span>
        <span className="linha-social-kcal num">
          {numero(progresso.calorias)} / {numero(progresso.meta_calorias)} kcal
        </span>
      </Link>
      {children}
    </div>
  );
}
