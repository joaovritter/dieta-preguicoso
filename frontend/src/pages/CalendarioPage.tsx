import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router-dom';
import { api, mensagemDoErro } from '../lib/api';
import { hojeISO } from '../lib/format';
import { deslocarMes, mesLongo } from '../lib/visual';
import { useAuth } from '../auth/useAuth';
import { useCaptura } from '../captura/CapturaContext';
import GradeCalendario from '../components/calendario/GradeCalendario';
import PainelDia from '../components/calendario/PainelDia';
import Erro from '../components/Erro';
import Tela from '../components/ui/Tela';
import TituloTela from '../components/ui/TituloTela';
import type { CalendarioMes } from '../lib/types';

const botaoMes = { minWidth: 28, minHeight: 32, fontFamily: 'inherit', fontSize: 15, color: 'text.secondary', '&.Mui-disabled': { opacity: 0.3 } } as const;

export default function CalendarioPage() {
  const { perfil } = useAuth();
  const { versao, abrirMenu } = useCaptura();
  const [params, setParams] = useSearchParams();
  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);
  const pedido = params.get('mes');
  const mes = pedido !== null && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) && pedido <= mesAtual ? pedido : mesAtual;

  const [calendario, setCalendario] = useState<CalendarioMes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escolha, setEscolha] = useState<{ mes: string; data: string } | null>(null);
  const selecionada = escolha?.mes === mes ? escolha.data : mes === mesAtual ? hoje : `${mes}-01`;

  useEffect(() => {
    if (perfil === null) return;
    let ativo = true;
    setCalendario(null);
    api
      .calendarioDe(perfil.id, mes)
      .then((c) => {
        if (ativo) setCalendario(c);
      })
      .catch((falha: unknown) => {
        if (ativo) setErro(mensagemDoErro(falha));
      });
    return () => {
      ativo = false;
    };
  }, [perfil, mes, versao]);

  const dia = calendario?.dias.find((d) => d.data === selecionada) ?? null;

  return (
    <Tela>
      <TituloTela
        direita={
          <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 12.5, color: 'text.secondary' }}>
            <ButtonBase aria-label="mês anterior" sx={botaoMes} onClick={() => setParams({ mes: deslocarMes(mes, -1) })}>‹</ButtonBase>
            <Box component="span" sx={{ px: '2px' }}>{mesLongo(mes)}</Box>
            <ButtonBase aria-label="mês seguinte" sx={botaoMes} disabled={mes >= mesAtual} onClick={() => setParams({ mes: deslocarMes(mes, 1) })}>›</ButtonBase>
          </Box>
        }
      >
        calendário
      </TituloTela>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      {calendario === null ? (
        <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>carregando o mês...</Typography>
      ) : (
        <>
          <GradeCalendario
            dias={calendario.dias}
            hoje={hoje}
            selecionada={selecionada}
            aoSelecionar={(data) => setEscolha({ mes, data })}
          />
          <Box sx={{ pt: '10px', borderTop: '1px solid', borderColor: 'neutro.linha' }}>
            {dia !== null && <PainelDia dia={dia} hoje={hoje} aoAdicionar={abrirMenu} />}
          </Box>
        </>
      )}
    </Tela>
  );
}
