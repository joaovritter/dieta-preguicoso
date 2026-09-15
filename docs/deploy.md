# Deploy na VPS (Contabo)

## Pré-requisitos

Docker e Docker Compose na VPS:

```bash
curl -fsSL https://get.docker.com | sh
```

## Subir

Caminho curto — um comando só, bom para quando a janela de acesso à VPS é curta:

```bash
git clone <seu-repo> dieta-preguicoso && cd dieta-preguicoso
OPENAI_API_KEY=sk-... DOMINIO=dieta.trainna.com.br bash scripts/instalar.sh
```

O script instala o Docker se faltar, sorteia os segredos, escreve o `.env`, prepara as
regras de firewall (sem ligar o ufw — isso no meio de uma sessão SSH é jeito conhecido de
ficar trancado do lado de fora) e sobe tudo com HTTPS. Roda quantas vezes quiser: não troca
segredo que já existe. Sem `DOMINIO`, sobe em `http://IP:8080` mesmo.

Na primeira vez o build demora alguns minutos; no fim ele espera a API responder e o
certificado sair, e diz o que fazer se algo não subir.

Na mão, se preferir:

```bash
git clone <seu-repo> dieta-preguicoso && cd dieta-preguicoso
cp .env.example .env
openssl rand -hex 32   # cole em JWT_SECRET
openssl rand -hex 16   # cole em POSTGRES_PASSWORD
nano .env              # preencha também OPENAI_API_KEY
docker compose up -d --build
```

O app fica em `http://SEU_IP:8080`. As migrations rodam sozinhas no boot do backend.

Verificar:

```bash
docker compose ps
docker compose logs -f backend
curl http://localhost:8080/api/health   # {"ok":true}
```

## Cadastro

Fica **aberto** (`PERMITIR_CADASTRO=true`, que já é o padrão): a rede social só funciona se
os seus amigos conseguirem criar conta neste mesmo servidor.

Se você já tinha fechado o cadastro numa instalação anterior, reabra assim:

```bash
sed -i 's/^PERMITIR_CADASTRO=.*/PERMITIR_CADASTRO=true/' .env
docker compose up -d backend
```

O que segura abuso com o cadastro aberto: `/api/auth/*` aceita no máximo 15 tentativas por
IP a cada 15 minutos, senha tem mínimo de 8 caracteres e hash bcrypt. Não é muito — é o
suficiente para um servidor entre amigos, não para um cadastro público de verdade.

Para trancar depois (só quem já tem conta continua entrando), é o mesmo comando com `false`;
aí `POST /api/auth/register` passa a responder `403 CADASTRO_DESABILITADO`.

## Firewall

Com o cadastro aberto e amigos usando de casa, a porta do app precisa ficar aberta —
travar por IP só valeria se você fosse o único usuário. Feche todo o resto:

```bash
ufw default deny incoming
ufw allow ssh
ufw allow 8080/tcp
ufw enable
```

**Enquanto não houver domínio e HTTPS, tudo trafega em claro** — inclusive a senha de quem
faz login. Avise o pessoal para não reaproveitar uma senha importante aqui, e resolva o TLS
assim que o domínio chegar. Depois do HTTPS ligado, a 8080 deixa de ser necessária:

```bash
ufw allow 80,443/tcp
ufw delete allow 8080/tcp
```

## Domínio e HTTPS (dieta.trainna.com.br)

O compose já traz um Caddy no perfil `https`, que pede e renova o certificado do
Let's Encrypt sozinho. São três partes: apontar o DNS, ligar o perfil, fechar a porta velha.

### 1. DNS no Cloudflare

Precisa do IP público da VPS em mãos (`curl -4 ifconfig.me` na VPS).

1. Entre em <https://dash.cloudflare.com> e clique no domínio **trainna.com.br** na lista.
2. Menu da esquerda → **DNS** → **Records**.
3. Botão **Add record** e preencha:
   - **Type**: `A`
   - **Name**: `dieta` (só isso; o Cloudflare completa para `dieta.trainna.com.br`)
   - **IPv4 address**: o IP da VPS
   - **Proxy status**: clique na nuvem laranja para deixá-la **cinza — DNS only**
   - **TTL**: `Auto`
4. **Save**.

A nuvem **precisa** ficar cinza. Laranja, quem responde pelo domínio é o Cloudflare, o
desafio do Let's Encrypt não chega no Caddy e o certificado não sai. Em troca você abre mão
do cache e do escudo de DDoS do Cloudflare — para um app entre amigos, é troca boa: a
renovação a cada 60 dias acontece sozinha e sem surpresa.

Confira antes de seguir (de qualquer máquina):

```bash
dig +short dieta.trainna.com.br     # tem que devolver o IP da VPS
```

Se voltar vazio, espere alguns minutos. Se voltar um IP que não é o da VPS, é cache do seu
resolvedor — teste com `dig +short dieta.trainna.com.br @1.1.1.1`.

### 2. Ligar o HTTPS na VPS

No `.env`:

```bash
DOMINIO=dieta.trainna.com.br
BIND_PUBLICO=127.0.0.1   # a porta 8080 deixa de ser alcançável de fora
TRUST_PROXY=2            # agora são dois proxies: Caddy -> nginx -> API
```

Abra as portas do HTTPS e suba:

```bash
ufw allow 80,443/tcp
docker compose --profile https up -d
docker compose logs -f caddy      # espere "certificate obtained successfully"
```

`BIND_PUBLICO=127.0.0.1` é o que realmente fecha a 8080: o Docker publica porta por regra
de NAT e **passa por cima do ufw**, então `ufw deny 8080` não bastaria.

### Se o trainna.com.br já roda nesta mesma VPS

Aí as portas 80 e 443 já têm dono e o Caddy do compose não sobe. Confira com
`ss -ltnp | grep -E ':(80|443)'`. Nesse caso não use o perfil `https`: aproveite o servidor
que já está lá e mande o subdomínio para o app. Com nginx, um comando resolve:

```bash
DOMINIO=dieta.trainna.com.br bash scripts/subdominio-nginx.sh
```

Ele cria **um arquivo novo** em `sites-available`, testa a configuração antes de recarregar
e chama o certbot (instalando, se faltar). Não encosta em vhost que já existe; se o teste do
nginx falhar, apaga o que criou e para, deixando os outros sites como estavam.

Se a VPS já tem um certificado que cobre o subdomínio — um Origin Certificate curinga do
Cloudflare, por exemplo — reaproveite em vez de pedir outro:

```bash
DOMINIO=dieta.trainna.com.br \
CERT=/etc/ssl/cloudflare/trainna.pem CHAVE=/etc/ssl/cloudflare/trainna.key \
TRUST_PROXY=3 bash scripts/subdominio-nginx.sh
```

**Quanto vale o `TRUST_PROXY`** (é ele que faz o limite de login contar por pessoa, não por
proxy): `2` com o Cloudflare em DNS only (nuvem cinza), `3` com o Cloudflare proxiando
(nuvem laranja), porque aí o edge dele entra como mais um salto no caminho.

O que ele escreve, se você preferir fazer na mão:

```nginx
server {
  listen 80;
  server_name dieta.trainna.com.br;
  client_max_body_size 30m;          # as fotos passam por aqui
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;         # a IA demora para responder sobre uma foto
  }
}
```

```bash
ln -s /etc/nginx/sites-available/dieta /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d dieta.trainna.com.br
```

Continua valendo `TRUST_PROXY=2` (são dois proxies: o nginx da VPS e o do compose). E aqui
`BIND_PUBLICO` fica em `127.0.0.1`, que é justamente onde o nginx da VPS vai buscar.

### 3. Conferir

```bash
curl -I https://dieta.trainna.com.br            # 200, certificado válido
curl -I http://SEU_IP:8080                      # tem que falhar: a porta não responde mais
```

Pronto — o app vive em `https://dieta.trainna.com.br` e as senhas param de trafegar em
claro. Não há CORS para configurar: o nginx serve o app e faz proxy de `/api` na mesma
origem. Os certificados ficam no volume `certificados`; não apague esse volume à toa,
o Let's Encrypt limita quantos pedidos você faz por semana.

## Atualizar

```bash
git pull
docker compose up -d --build                    # sem HTTPS
docker compose --profile https up -d --build    # com HTTPS
```

Esquecer o `--profile https` não derruba o Caddy que já está rodando, mas também não o
atualiza. Na dúvida, use sempre a segunda forma depois que o domínio estiver no ar.

## Backup

O dump vale mais que o resto: é o seu diário alimentar. As mídias são descartáveis.

```bash
mkdir -p ~/backups
docker compose exec -T postgres pg_dump -U dieta dieta | gzip > ~/backups/dieta-$(date +%F).sql.gz
```

Diário às 3h, guardando 30 dias:

```bash
crontab -e
```

```cron
0 3 * * * cd /caminho/para/dieta-preguicoso && docker compose exec -T postgres pg_dump -U dieta dieta | gzip > ~/backups/dieta-$(date +\%F).sql.gz && find ~/backups -name 'dieta-*.sql.gz' -mtime +30 -delete
```

Copie os dumps para fora da VPS de vez em quando — backup que mora no mesmo disco não é backup.

## Restaurar

```bash
gunzip -c ~/backups/dieta-2026-09-10.sql.gz | docker compose exec -T postgres psql -U dieta -d dieta
```

## Custo de IA

O app fala com **um** serviço de IA, escolhido por `IA_PROVEDOR` no `.env`. Trocar não mexe
em código: só na variável e num `docker compose up -d backend`.

**Gemini** (`IA_PROVEDOR=gemini`) tem camada gratuita, com limite de requisições por minuto
e por dia. Para um grupo de amigos registrando ~4 refeições por dia cada, sobra folga. Pegue
a chave em <https://aistudio.google.com/apikey> e confira em `GEMINI_MODEL` se o nome do
modelo existe na sua conta — se não existir, o log do backend diz na hora
(`docker compose logs --tail 20 backend`, linha com `[gemini]`).

`GEMINI_MODEL` aceita vários modelos separados por vírgula
(`gemini-3.6-flash,gemini-2.5-flash`). O primeiro atende sempre; o backend só cai para o
seguinte depois de repetir três vezes no primeiro. Isso cobre os erros passageiros que
aparecem no log como `[gemini] <modelo> 503` (modelo sobrecarregado) e `429` (cota do dia
ou do minuto estourada).

Vale saber: camada gratuita costuma significar que os dados podem ser usados para melhorar
o produto. São fotos de comida, não é dado crítico — mas é escolha, não detalhe.

**OpenAI** (`IA_PROVEDOR=openai`) cobra desde o primeiro token: cada foto é uma chamada de
visão e cada áudio é Whisper mais uma de chat. Para uso pessoal fica na casa de centavos por
dia, mas com o grupo inteiro usando, a conta é sua — vale pôr limite mensal em Billing. Para
apertar, troque `OPENAI_MODEL_TEXTO` e `OPENAI_MODEL_VISAO` para `gpt-4o-mini`.

Nos dois casos a estimativa é de um modelo olhando foto ou lendo frase: serve para
tendência, não para prescrição. A tela de confirmação existe por causa disso.
