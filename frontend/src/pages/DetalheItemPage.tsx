import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, mensagemDoErro } from '../lib/api';
import { dataValida, hojeISO } from '../lib/format';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { corDaRefeicao } from '../lib/visual';
import { useConfirmacao } from '../components/useConfirmacao';
import DetalheAlimento from '../components/detalhe/DetalheAlimento';
import Erro from '../components/Erro';
import type { Alimento, Registro } from '../lib/types';

export default function DetalheItemPage() {
  const { id = '', indice = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const hoje = hojeISO();
  const data = dataValida(params.get('data'), hoje);
  const voltarPara = data === hoje ? '/' : `/?data=${data}`;
  const posicao = Number(indice);
  const { refeicoes } = useRefeicoes();
  const { confirmar, elemento: confirmacao } = useConfirmacao();

  const [registro, setRegistro] = useState<Registro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    api
      .registrosDoDia(data)
      .then((dia) => {
        if (!ativo) return;
        const achado = dia.refeicoes.flatMap((g) => g.registros).find((r) => r.id === id) ?? null;
        if (achado === null || achado.alimentos_detectados[posicao] === undefined) {
          navigate(voltarPara, { replace: true });
          return;
        }
        setRegistro(achado);
      })
      .catch((falha: unknown) => {
        if (ativo) setErro(mensagemDoErro(falha));
      });
    return () => {
      ativo = false;
    };
  }, [data, id, posicao, navigate, voltarPara]);

  async function gravar(alimentos: Alimento[]) {
    if (registro === null) return;
    setSalvando(true);
    try {
      await api.atualizarRegistro(registro.id, { alimentos });
      navigate(voltarPara, { replace: true });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
      setSalvando(false);
    }
  }

  async function remover() {
    if (registro === null) return;
    const restantes = registro.alimentos_detectados.filter((_, i) => i !== posicao);
    if (restantes.length > 0) {
      await gravar(restantes);
      return;
    }
    const ok = await confirmar({
      titulo: 'remover registro',
      texto: 'era o único alimento: o registro inteiro sai do dia e do feed dos seus amigos.',
      rotulo: 'remover',
    });
    if (!ok) return;
    setSalvando(true);
    try {
      await api.excluirRegistro(registro.id);
      navigate(voltarPara, { replace: true });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
      setSalvando(false);
    }
  }

  const alimento = registro?.alimentos_detectados[posicao];

  return (
    <>
      {erro !== null && (
        <Box sx={{ maxWidth: 480, mx: 'auto', px: '22px', pt: '14px' }}>
          <Erro mensagem={erro} aoFechar={() => setErro(null)} />
        </Box>
      )}
      {registro === null || alimento === undefined ? (
        <Typography sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>carregando...</Typography>
      ) : (
        <DetalheAlimento
          alimento={alimento}
          refeicaoNome={registro.refeicao_nome}
          cor={corDaRefeicao(registro.refeicao_id, refeicoes)}
          salvando={salvando}
          aoVoltar={() => navigate(voltarPara)}
          aoSalvar={(novo) => void gravar(registro.alimentos_detectados.map((a, i) => (i === posicao ? novo : a)))}
          aoRemover={() => void remover()}
        />
      )}
      {confirmacao}
    </>
  );
}
