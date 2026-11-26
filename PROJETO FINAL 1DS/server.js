const http = require('http') // Usado para criar o servidor WEB
const fs = require('fs') // FS = File System
const path = require('path') // Para manipular arquivos e pastas

const { executarQueryNeon } = require('./script_db_quantum')

const PORTA = process.env.PORT || 3001

const { atenderProdutos } = require('./produtos-api')

const arquivos = {
    '/produtos.html': { arquivo: 'produtos.html', tipo: 'text/html; charset=utf-8' },
    '/produtos.js': { arquivo: 'produtos.js', tipo: 'text/javascript; charset=utf-8' },
    '/': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/index.html': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/app.js': { arquivo: 'app.js', tipo: 'text/javascript; charset=utf-8' },
    '/style.css': { arquivo: 'style.css', tipo: 'text/css; charset=utf-8' }
}

function responderJSON(res, status, dados) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(dados))
}

function lerCorpo(req) {
    if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    return new Promise((resolve, reject) => {
        let corpo = ''
        req.on('data', pedaco => corpo += pedaco)

        req.on('end', () => {
            try {
                resolve(JSON.parse(corpo || '{}'))
            } catch (erro) {
                reject(erro)
            }
        })

        req.on('error', reject)
    })
}

// Lista todas as categorias. Retorna null se der erro no banco.
async function buscarCategorias() {
    return await executarQueryNeon('SELECT * FROM categoria ORDER BY id_categoria')
}

// Insere uma categoria e devolve a linha criada. Retorna null se der erro.
async function insertCategoria(descricao) {
    const linhas = await executarQueryNeon(
        'INSERT INTO categoria (descricao) VALUES ($1) RETURNING *',
        [descricao]
    )
    if (linhas === null || linhas.length === 0) return null
    return linhas[0]
}

// Atualiza uma categoria pelo ID. Retorna null em erro, false se não existir, ou a linha atualizada.
async function atualizarCategoria(id, descricao) {
    const linhas = await executarQueryNeon(
        'UPDATE categoria SET descricao = $1 WHERE id_categoria = $2 RETURNING *',
        [descricao, id]
    )
    if (linhas === null) return null
    if (linhas.length === 0) return false
    return linhas[0]
}

// Remove uma categoria pelo ID. Retorna null em erro, false se não existir, ou a linha removida.
async function deletarCategoria(id) {
    const linhas = await executarQueryNeon(
        'DELETE FROM categoria WHERE id_categoria = $1 RETURNING *',
        [id]
    )
    if (linhas === null) return null
    if (linhas.length === 0) return false
    return linhas[0]
}

async function atenderRequisicao(req, res) {
    const pathname = new URL(req.url, `http://localhost:${PORTA}`).pathname

    if (/^\/api\/produtos(?:\/|$)/.test(pathname)) {
        return atenderProdutos(req, res, pathname, lerCorpo, responderJSON)
    }

    // Listar os itens da tabela categoria do DB via GET
    if (pathname === '/api/categorias' && req.method === 'GET') {
        const linhas = await buscarCategorias()
        if (linhas === null) {
            return responderJSON(res, 500, { erro: 'Falha ao consultar o banco' })
        }
        return responderJSON(res, 200, linhas)
    }

    // Inserir uma nova categoria via POST
    if (pathname === '/api/categorias' && req.method === 'POST') {
        let corpo
        try {
            corpo = await lerCorpo(req)
        } catch (erro) {
            return responderJSON(res, 400, { erro: 'JSON inválido' })
        }

        const descricao = (corpo.descricao || '').trim()
        if (!descricao) {
            return responderJSON(res, 400, { erro: 'Informe a descrição' })
        }

        const novaCategoria = await insertCategoria(descricao)
        if (novaCategoria === null) {
            return responderJSON(res, 500, { erro: 'Falha ao inserir no banco' })
        }

        return responderJSON(res, 201, novaCategoria)
    }

    // Rotas com ID: /api/categorias/:id (PUT para editar, DELETE para excluir)
    const matchCategoriaId = pathname.match(/^\/api\/categorias\/(\d+)$/)
    if (matchCategoriaId) {
        const id = Number(matchCategoriaId[1])

        if (req.method === 'PUT') {
            let corpo
            try {
                corpo = await lerCorpo(req)
            } catch (erro) {
                return responderJSON(res, 400, { erro: 'JSON inválido' })
            }

            const descricao = (corpo.descricao || '').trim()
            if (!descricao) {
                return responderJSON(res, 400, { erro: 'Informe a descrição' })
            }

            const atualizada = await atualizarCategoria(id, descricao)
            if (atualizada === null) {
                return responderJSON(res, 500, { erro: 'Falha ao atualizar no banco' })
            }
            if (atualizada === false) {
                return responderJSON(res, 404, { erro: 'Categoria não encontrada' })
            }

            return responderJSON(res, 200, atualizada)
        }

        if (req.method === 'DELETE') {
            const removida = await deletarCategoria(id)
            if (removida === null) {
                return responderJSON(res, 500, { erro: 'Falha ao excluir no banco' })
            }
            if (removida === false) {
                return responderJSON(res, 404, { erro: 'Categoria não encontrada' })
            }

            return responderJSON(res, 200, {
                mensagem: 'Categoria excluída com sucesso',
                categoria: removida
            })
        }
    }

    // Arquivos estáticos (html, js, css)
    const rota = arquivos[pathname]
    if (rota) {
        const caminho = path.join(__dirname, rota.arquivo)
        return fs.readFile(caminho, (erro, conteudo) => {
            if (erro) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
                return res.end('Arquivo não encontrado: ' + rota.arquivo)
            }

            res.writeHead(200, { 'Content-Type': rota.tipo })
            res.end(conteudo)
        })
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Página não encontrada')
}

const servidor = http.createServer(atenderRequisicao)

if (require.main === module) {
    servidor.listen(PORTA, () => {
        console.log('Servidor Online')
        console.log('Loja do Zé')
        console.log(`link: http://localhost:${PORTA}`)
    })
}

module.exports = servidor

module.exports.atenderRequisicao = atenderRequisicao
