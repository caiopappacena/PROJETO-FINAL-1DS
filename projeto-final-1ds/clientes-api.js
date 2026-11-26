const { executarQueryNeon } = require('./script_db_quantum')

async function cadastrarCliente(req, res, lerCorpo, responderJSON) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return responderJSON(res, 405, { erro: 'Use o formulário para cadastrar um cliente.' })
    }
    let dados
    try { dados = await lerCorpo(req) } catch { return responderJSON(res, 400, { erro: 'JSON inválido.' }) }
    const campo = chave => typeof dados?.[chave] === 'string' ? dados[chave].trim() : ''
    const nome = campo('nome')
    const email = campo('email').toLowerCase()
    const endereco = campo('endereco')
    const telefone = campo('telefone').replace(/[\s()+-]/g, '')
    if (!nome || nome.length > 100 || !endereco || endereco.length > 150 || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return responderJSON(res, 400, { erro: 'Confira o nome, o e-mail e o endereço.' })
    }
    const nacional = telefone.replace(/^55(?=\d{10,11}$)/, '')
    if (!/^[1-9]\d{9,10}$/.test(nacional)) {
        return responderJSON(res, 400, { erro: 'Informe um telefone brasileiro com DDD.' })
    }
    const linhas = await executarQueryNeon(
        'INSERT INTO cliente (nome, email, telefone, endereco) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id_cliente',
        [nome, email, nacional, endereco]
    )
    if (!linhas) return responderJSON(res, 500, { erro: 'Falha ao salvar. Tente novamente.' })
    if (!linhas.length) return responderJSON(res, 409, { erro: 'Confira se o e-mail ou o telefone já foi cadastrado.' })
    return responderJSON(res, 201, { mensagem: 'Cliente cadastrado.' })
}
module.exports = { cadastrarCliente }
