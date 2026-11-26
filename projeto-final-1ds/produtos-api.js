const { executarQueryNeon } = require('./script_db_quantum')

async function atenderProdutos(req, res, pathname, lerCorpo, responderJSON) {
    const enviar = (status, dados) => responderJSON(res, status, dados)
    const rota = pathname.match(/^\/api\/produtos(?:\/(\d+))?$/)
    if (!rota) return enviar(404, { erro: 'Rota não encontrada.' })
    const id = rota[1] && Number(rota[1])
    if (rota[1] && (!id || id > 2147483647)) return enviar(404, { erro: 'Produto não encontrado.' })
    let linhas
    if (!id && req.method === 'GET') {
        linhas = await executarQueryNeon('SELECT p.*, c.descricao AS categoria FROM produto p LEFT JOIN categoria c USING (id_categoria) ORDER BY p.nome, p.id_produto')
        return linhas === null ? enviar(500, { erro: 'Falha ao consultar os produtos.' }) : enviar(200, linhas)
    }
    if (id && req.method === 'DELETE') {
        linhas = await executarQueryNeon('DELETE FROM produto WHERE id_produto = $1 RETURNING id_produto', [id])
        if (linhas === null) return enviar(409, { erro: 'Não foi possível excluir. Confira se há vendas vinculadas ao produto.' })
    } else if ((!id && req.method === 'POST') || (id && req.method === 'PUT')) {
        let dados
        try { dados = await lerCorpo(req) } catch { return enviar(400, { erro: 'JSON inválido.' }) }
        const { nome, descricao = '', preco, validade, id_categoria } = dados || {}
        if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 100 || typeof descricao !== 'string') {
            return enviar(400, { erro: 'Informe um nome com até 100 caracteres e uma descrição válida.' })
        }
        if (!['number', 'string'].includes(typeof preco) || !/^\d{1,17}(\.\d{1,2})?$/.test(String(preco))) {
            return enviar(400, { erro: 'Informe um preço positivo ou zero, com até duas casas decimais.' })
        }
        if (validade && (typeof validade !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(validade) || !Number.isFinite(Date.parse(validade)) || new Date(validade).toISOString().slice(0,10) !== validade)) {
            return enviar(400, { erro: 'Informe uma data válida.' })
        }
        if (id_categoria != null && (!Number.isInteger(id_categoria) || id_categoria <= 0 || id_categoria > 2147483647)) {
            return enviar(400, { erro: 'Categoria inválida.' })
        }
        const valores = [nome.trim(), descricao.trim(), preco, validade || null, id_categoria ?? null]
        if (id) {
            linhas = await executarQueryNeon('UPDATE produto SET nome=$1, descricao=$2, preco=$3, validade=$4, id_categoria=$5 WHERE id_produto=$6 RETURNING *', [...valores, id])
        } else {
            linhas = await executarQueryNeon('INSERT INTO produto (nome, descricao, preco, validade, id_categoria) VALUES ($1,$2,$3,$4,$5) RETURNING *', valores)
        }
    } else {
        return enviar(405, { erro: 'Método não permitido.' })
    }
    if (linhas === null) return enviar(500, { erro: 'Falha ao salvar o produto. Confira a categoria e tente novamente.' })
    if (!linhas.length) return enviar(404, { erro: 'Produto não encontrado.' })
    return enviar(req.method === 'POST' ? 201 : 200, linhas[0])
}
module.exports = { atenderProdutos }
