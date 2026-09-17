import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import LiquidGlassTabBar from '../components/tabbar/LiquidGlassTabBar';
import type { ItemTab } from '../components/tabbar/LiquidGlassTabBar';
import { IconeCalendario, IconeInicio, IconePerfil, IconeSocial } from '../components/tabbar/icones';
import MenuCaptura from '../components/captura/MenuCaptura';
import { api } from '../lib/api';
import { abaDaRota, ehIdAba, ROTA_DA_ABA } from './abas';

export default function Casca() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const [pedidosRecebidos, setPedidosRecebidos] = useState(0);
  const emSocial = pathname.startsWith('/social');

  useEffect(() => {
    let ativo = true;
    api
      .pedidos()
      .then((pedidos) => {
        if (ativo) setPedidosRecebidos(pedidos.recebidos.length);
      })
      .catch(() => {
        // O badge é só um aviso: se a chamada falhar a navegação continua funcionando.
      });
    return () => {
      ativo = false;
    };
  }, [emSocial]);

  const itens: ItemTab[] = [
    { id: 'inicio', rotulo: 'início', icone: <IconeInicio /> },
    { id: 'social', rotulo: 'social', icone: <IconeSocial />, badge: pedidosRecebidos },
    { id: 'calendario', rotulo: 'calendário', icone: <IconeCalendario /> },
    { id: 'perfil', rotulo: 'perfil', icone: <IconePerfil /> },
  ];

  return (
    <>
      <Box sx={{ pb: 'calc(110px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </Box>
      <LiquidGlassTabBar
        itens={itens}
        ativo={abaDaRota(pathname)}
        aoTrocar={(id) => {
          if (ehIdAba(id)) navegar(ROTA_DA_ABA[id]);
        }}
        acaoCentral={<MenuCaptura />}
      />
    </>
  );
}
