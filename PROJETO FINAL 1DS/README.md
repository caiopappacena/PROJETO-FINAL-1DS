# Loja do Zé

Aplicação Node.js + PostgreSQL (Neon) para cadastrar, listar, editar e excluir categorias.

## Como rodar no VS Code (localhost)

1. Extraia o arquivo `.zip` e abra a pasta `loja-do-ze` no VS Code.
2. Abra o terminal integrado do VS Code e instale as dependências:
   ```bash
   npm install
   ```
3. Confirme no painel do Neon se as tabelas do arquivo `quantum-db.sql` já foram criadas.
4. Inicie o servidor:
   ```bash
   npm start
   ```
5. Acesse no navegador: `http://localhost:3001`

*(Opcional)* Para inserir categorias de exemplo no banco, rode:
```bash
npm run seed
```

## Como subir para o GitHub com segurança

O arquivo `.gitignore` já está configurado para ignorar `node_modules/` e `.env`, evitando que sua senha do banco vá para o GitHub.

1. Crie um repositório vazio no GitHub.
2. No terminal dentro da pasta `loja-do-ze`, execute:
   ```bash
   git init
   git add .
   git commit -m "Projeto Loja do Zé com CRUD de categorias e CSS"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
