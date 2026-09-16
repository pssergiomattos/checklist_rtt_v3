# RTT Check - REMA TIP TOP

Aplicativo PWA de Controle de Qualidade (Checklists industriais fotográficos, cálculo de Ponto de Orvalho e Medição de Carcaça).

---

## 🚀 Como Rodar Localmente

1. Clone o repositório ou baixe os arquivos:
   ```bash
   git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   cd SEU-REPOSITORIO
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse no seu navegador: `http://localhost:3000` (ou na porta indicada no terminal).

---

## 📦 Como Gerar a Versão de Produção (Build)

Para compilar o aplicativo para publicação em qualquer hospedagem (GitHub Pages, Vercel, Netlify, Firebase Hosting, Apache, Nginx):

```bash
npm run build
```

Os arquivos prontos e otimizados para produção serão gerados na pasta **`dist/`**.

---

## 🌐 Como Publicar no GitHub Pages (2 Opções)

### Opção 1: Automático via GitHub Actions (Recomendado)
O projeto já conta com o arquivo `.github/workflows/deploy.yml`:
1. No seu repositório no GitHub, acesse **Settings** > **Pages** (no menu lateral esquerdo).
2. Em **Build and deployment** > **Source**, selecione **GitHub Actions**.
3. Faça um push para a branch `main` ou `master` (ou clique em **Actions** > **Deploy to GitHub Pages** > **Run workflow**).
4. O GitHub irá compilar o app e publicá-lo automaticamente!

### Opção 2: Publicação Manual da pasta `dist`
1. Execute localmente:
   ```bash
   npm run build
   ```
2. Suba o conteúdo gerado dentro da pasta `dist/` para a branch `gh-pages` ou configure o GitHub Pages para servir a pasta raiz com esses arquivos.

---

## ⚡ Por que não funcionou ao subir apenas o código puro?
Aplicações modernas em **React + TypeScript + Tailwind + Vite** não funcionam simplesmente abrindo o `index.html` da raiz diretamente no navegador sem compilação. Elas precisam passar pelo comando `npm run build` para converter o TypeScript e JSX nos arquivos finais otimizados (`dist/`).
