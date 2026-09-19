# Pulse Finance

Controle financeiro pessoal, educacional e **100% local**. Nenhum dado sai do
seu navegador — não há backend, não há conta na nuvem, não há chaves de API.

## Objetivo

Ajudar pessoas comuns a organizar receitas, despesas, orçamentos, metas e
patrimônio, com educação financeira embutida nos próprios dados (não apenas
gráficos bonitos).

## Stack

- **Vite** (bundler + dev server) — vanilla JavaScript (ES Modules), sem framework.
- **IndexedDB** para persistência local, com fallback em `localStorage`.
- **Chart.js** para gráficos.
- **SheetJS (xlsx)** para importação de planilhas.
- **pdf.js** para extração de texto de extratos em PDF.

Não há dependência de backend para o funcionamento normal do app.

## Arquitetura

```
UI (views/components)
   ↓
Services (regras de negócio: transações, importação, relatórios, insights)
   ↓
Repositories (acesso a dados por entidade: transações, contas, categorias...)
   ↓
Store (estado em memória + notificação de mudanças)
   ↓
db.js (único módulo que fala com IndexedDB)
```

Essa separação existe para permitir, no futuro, trocar IndexedDB por uma API
REST reescrevendo apenas `src/core/db.js` e `src/core/store.js`, sem tocar em
repositórios, serviços ou UI.

```
src/
├── core/          # db.js (IndexedDB), store.js (estado), router.js (navegação)
├── models/        # schema.js — dataset vazio e dataset de demonstração
├── repositories/  # CRUD puro por entidade
├── services/      # regras de negócio (transações, import, insights, relatórios, preferências, demo)
├── import/        # parsers (JSON, Excel/CSV, PDF, OFX) + reconciliação/duplicados
├── ui/
│   ├── components/  # sidebar, header, modal, toast, empty-state, gráficos
│   └── views/       # uma tela por arquivo
├── styles/        # tokens.css (design system), base.css (mobile-first), print.css
└── utils/         # formatação, sanitização (anti-XSS), validação
```

## Executar localmente

```bash
git clone <url-do-repositorio>
cd pulse-finance
npm install
npm run dev       # http://localhost:5173
```

## Build de produção / GitHub Pages

```bash
npm run build      # gera a pasta dist/
npm run preview    # serve o build localmente para conferência
```

O `vite.config.js` usa `base: './'` (caminhos relativos), então o build
funciona tanto na raiz de um domínio quanto em um subcaminho de GitHub Pages
(`usuario.github.io/pulsefinance/`). Um workflow pronto em
`.github/workflows/deploy.yml` publica `dist/` automaticamente a cada push
na branch principal.

## Testes

```bash
npm test
```

Suíte de testes de fumaça/regressão (Vitest + jsdom + IndexedDB simulado)
que valida: onboarding, estado zerado no primeiro acesso, CRUD de
transações, matemática do parcelamento, isolamento do modo demonstração e
navegação por todas as telas sem exceções.

## Persistência e controle mensal

Categorias, contas, cartões, orçamentos e metas são entidades globais —
ficam automaticamente disponíveis em qualquer mês, sem precisar de um passo
manual de "copiar configurações". Apenas as transações são específicas de
cada mês, e nunca são copiadas ou apagadas automaticamente ao criar um novo
mês.

## Dívidas, recorrências e Calendário Financeiro (Fase 1 de evolução)

O Pulse funciona como um sistema conectado: cadastrar uma dívida ou uma
renda/despesa recorrente alimenta automaticamente outras telas, sem exigir
que o usuário lance a mesma informação duas vezes.

- **Dívidas** (`src/repositories/debt-repository.js`, `src/services/debt-service.js`)
  — cadastradas em "Bens & Dívidas", com ou sem parcelamento. Ao cadastrar,
  as parcelas futuras são geradas automaticamente (a última parcela absorve
  o arredondamento). Marcar uma parcela como paga cria a transação real
  correspondente, atualiza o status da dívida (`aberta` → `quitada` apenas
  quando a última parcela é paga) e remove aquele compromisso das
  pendências — tudo em uma única operação, com opção de desfazer.
- **Renda e despesas recorrentes** (`src/repositories/recurring-repository.js`)
  — cadastradas na tela Calendário. Suportam a regra de "último dia útil do
  mês" (`src/utils/dates.js`), com fins de semana tratados como não úteis
  (estrutura pronta para receber feriados brasileiros no futuro).
- **Calendário Financeiro** (`src/services/calendar-service.js`,
  `src/ui/views/calendar-view.js`) — visão consolidada por mês que une
  transações reais, parcelas de dívidas pendentes e ocorrências projetadas
  de recorrências, sem duplicar quando já existe um lançamento real
  equivalente. O Dashboard usa a mesma fonte para "Próximos compromissos",
  então as duas telas nunca mostram números diferentes.

**Limitação atual, por design**: o saldo das contas (`conta.saldo`) continua
sendo um valor informado manualmente pelo usuário — pagar uma parcela não o
recalcula automaticamente (o mesmo já valia para transações comuns antes
desta evolução). Uma contabilidade de partida dobrada real é um passo maior,
fora do escopo desta fase.

## Importação de dados

Três formatos, escolhidos explicitamente pelo usuário (não é mais uma
pergunta sobre "conta ou cartão de destino"):

- **JSON** — backup completo do Pulse (restauração) ou lista de lançamentos.
- **Excel / CSV / OFX** — detecção automática de colunas (Data, Descrição,
  Valor, Tipo, Categoria); quando a detecção falha, uma etapa de mapeamento
  manual é exibida.
- **PDF** — extração de texto via pdf.js com reconhecimento de linhas no
  padrão `data + descrição + valor`, comum em extratos bancários.

Antes de confirmar, sempre é exibido um resumo (quantidade, receitas,
despesas, período) e uma verificação de possíveis duplicados.

## Limitações conhecidas (honestas, por design)

- **Importação de PDF é "melhor esforço", não universal.** Bancos usam
  layouts muito diferentes. O parser reconhece um padrão comum
  (`data descrição valor`), mas extratos com tabelas complexas, múltiplas
  colunas ou PDFs escaneados (sem texto selecionável) não serão
  interpretados — o usuário verá uma mensagem clara em vez de dados errados
  inventados.
- **Mapeamento de colunas do Excel é feito por seletores**, não por
  arrastar-e-soltar visual.
- **Pulse IA local é baseado em regras** sobre os dados já existentes
  (saldo, receitas, despesas, categorias) — não é um modelo de linguagem.
  Para análises mais profundas, o botão "Abrir ChatGPT" leva à ferramenta
  externa; nenhum dado é enviado automaticamente.
- **Sem autenticação real.** O nome informado no onboarding personaliza a
  experiência, mas não protege os dados — qualquer pessoa com acesso ao
  navegador vê as informações salvas ali.

## Privacidade

- Dados salvos apenas no IndexedDB do navegador, neste dispositivo.
- Nunca são armazenados: senha bancária, CVV, credenciais ou tokens.
- "Exportar dados", "Importar dados" e "Resetar dados" ficam em Ajustes.
- **Modo Privado** (ícone de olho no topo, ou em Ajustes): mascara os
  dígitos de todo valor monetário exibido na tela. Não se aplica ao
  relatório em PDF nem às exportações (CSV/JSON) — gerar um relatório é uma
  ação deliberada do usuário, e mascará-lo tornaria o recurso inútil.
- **Alertas** (Ajustes → Alertas): avisa sobre despesas/receitas vencendo,
  orçamentos estourados e metas com prazo apertado. O prazo de antecedência
  é configurável (1/2/3 dias, no dia, ou desativado); "Desativado" desliga
  todos os tipos de alerta, incluindo os de orçamento.

## Roadmap (não implementado nesta versão)

- Backend/API real com sincronização entre dispositivos (a arquitetura em
  camadas já foi preparada para isso — ver seção Arquitetura).
- Autenticação de verdade (hoje é apenas um nome de exibição).
- Editor de mapeamento por arrastar-e-soltar na importação de planilhas.
- Edição de tipo/categoria linha a linha na tela de conciliação antes de
  confirmar a importação (hoje a correção é feita depois, na tela de
  Transações).

### Próximas fases da evolução "Carteira Digital" (ainda não implementadas)

Todas as 30 seções do pedido original foram endereçadas ao longo das fases
de evolução (dívidas com parcelamento, calendário financeiro, previsão
multi-mês, simulador "E se?", Pulse Score, Saúde Financeira, Metas 2.0,
evolução do patrimônio, Modo Privado, alertas, gamificação, Carreira
Financeira, Meu Ano Financeiro e a reorganização do Dashboard). Simplificações
conscientes, documentadas nos comentários dos respectivos serviços:

- **Gamificação** é calculada ao vivo a cada acesso (não existe um registro
  persistido de "quando" cada conquista foi desbloqueada).
- **Carreira Financeira** é opcional e não alimenta nenhum cálculo — serve
  só de contexto; a "evolução da renda" real vem das transações lançadas.
- **Pulse Score / Saúde Financeira** usam fatores fixos e pesos iguais —
  refinar os pesos exigiria mais dados de uso real para calibrar.

O que continua fora do escopo, por decisão explícita do pedido original:
backend/API real com sincronização entre dispositivos, e autenticação de
verdade (a arquitetura em camadas já está preparada para isso quando fizer
sentido).
