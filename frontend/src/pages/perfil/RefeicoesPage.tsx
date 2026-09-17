import { useState } from 'react';
import { mensagemDoErro } from '../../lib/api';
import SecaoRefeicoes from '../../components/SecaoRefeicoes';
import SubTela from '../../components/perfil/SubTela';
import Erro from '../../components/Erro';

export default function RefeicoesPage() {
  const [erro, setErro] = useState<string | null>(null);
  return (
    <SubTela titulo="refeições" voltarPara="/perfil">
      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}
      <SecaoRefeicoes aoFalhar={(falha: unknown) => setErro(mensagemDoErro(falha))} />
    </SubTela>
  );
}
