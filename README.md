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

## Roadmap (não implementado nesta versão)

- Backend/API real com sincronização entre dispositivos (a arquitetura em
  camadas já foi preparada para isso — ver seção Arquitetura).
- Autenticação de verdade (hoje é apenas um nome de exibição).
- Editor de mapeamento por arrastar-e-soltar na importação de planilhas.
- Edição de tipo/categoria linha a linha na tela de conciliação antes de
  confirmar a importação (hoje a correção é feita depois, na tela de
  Transações).
