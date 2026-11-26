const form = document.querySelector('#produto')
const campos = form.elements
const lista = document.querySelector('#produtos')
const mensagem = document.querySelector('#mensagem')
const salvar = document.querySelector('#btn-salvar')
const limpar = document.querySelector('#btn-limpar')
const titulo = document.querySelector('#titulo')
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
let editando = null

async function requisitar(url, opcoes) {
    const resposta = await fetch(url, { cache: 'no-store', ...opcoes })
    const dados = await resposta.json()
    if (!resposta.ok) throw new Error(dados.erro || 'Falha na solicitação.')
    return dados
}

function editar(produto) {
    editando = produto
    form.reset()
    if (produto) {
        for (const chave of ['nome', 'preco', 'descricao', 'validade']) campos[chave].value = produto[chave] ?? ''
        campos.categoria.value = produto.id_categoria ?? ''
    }
    titulo.textContent = produto ? 'Editar produto' : 'Novo produto'
    salvar.textContent = produto ? 'Salvar alterações' : 'Cadastrar'
    limpar.textContent = produto ? 'Cancelar' : 'Limpar'
    campos.nome.focus()
}

function elemento(tag, texto) {
    const el = document.createElement(tag)
    el.textContent = texto
    return el
}

async function listar() {
    try {
        const produtos = await requisitar('/api/produtos')
        lista.replaceChildren()
        if (!produtos.length) lista.append(elemento('li', 'Nenhum produto cadastrado.'))
        for (const produto of produtos) {
            const item = document.createElement('li')
            item.append(elemento('strong', produto.nome), elemento('span', moeda.format(produto.preco)))
            const detalhes = [produto.categoria, produto.descricao]
            if (produto.validade) detalhes.push('Validade ' + produto.validade.split('-').reverse().join('/'))
            if (detalhes.some(Boolean)) item.append(elemento('small', detalhes.filter(Boolean).join(' · ')))
            const acoes = document.createElement('div')
            acoes.className = 'acoes'
            const alterar = elemento('button', 'Editar')
            alterar.className = 'btn-editar'
            alterar.onclick = () => { mensagem.textContent = ''; editar(produto) }
            const excluir = elemento('button', 'Excluir')
            excluir.className = 'btn-excluir'
            excluir.onclick = async () => {
                if (!confirm('Excluir o produto “' + produto.nome + '”?')) return
                excluir.disabled = true
                try {
                    await requisitar('/api/produtos/' + produto.id_produto, { method: 'DELETE' })
                    if (editando?.id_produto === produto.id_produto) editar(null)
                    mensagem.textContent = 'Produto excluído.'
                    await listar()
                } catch (erro) { mensagem.textContent = erro.message }
                finally { excluir.disabled = false }
            }
            acoes.append(alterar, excluir)
            item.append(acoes)
            lista.append(item)
        }
    } catch { lista.replaceChildren(elemento('li', 'Falha ao carregar a lista de produtos. Atualize a página para tentar novamente.')) }
}

form.onsubmit = async evento => {
    evento.preventDefault()
    if (salvar.disabled) return
    salvar.disabled = true
    const dados = Object.fromEntries(new FormData(form))
    dados.id_categoria = dados.categoria ? Number(dados.categoria) : null
    delete dados.categoria
    try {
        const url = editando ? '/api/produtos/' + editando.id_produto : '/api/produtos'
        await requisitar(url, { method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) })
        mensagem.textContent = editando ? 'Produto atualizado.' : 'Produto cadastrado.'
        editar(null)
        await listar()
    } catch (erro) { mensagem.textContent = erro.message }
    finally { salvar.disabled = false }
}
limpar.onclick = () => { editar(null); mensagem.textContent = '' }

async function iniciar() {
    try {
        const categorias = await requisitar('/api/categorias')
        for (const categoria of categorias) campos.categoria.add(new Option(categoria.descricao, categoria.id_categoria))
    } catch {
        mensagem.textContent = 'Falha ao carregar as categorias. Atualize a página para editar os produtos.'
        form.querySelectorAll('input, textarea, select, button').forEach(el => { el.disabled = true })
    }
    await listar()
}
iniciar()
