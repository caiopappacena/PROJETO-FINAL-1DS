// Este arquivo roda no NAVEGADOR.
// Ele não fala com o Neon: chama as rotas /api do nosso server.js.

const lista = document.getElementById('lista-categorias')
const formulario = document.getElementById('form-categoria')
const campoDescricao = document.getElementById('descricao')
const mensagem = document.getElementById('mensagem')
const tituloForm = document.getElementById('titulo-form')
const btnSalvar = document.getElementById('btn-salvar')
const btnLimpar = document.getElementById('btn-limpar')

let idEmEdicao = null

function mostrarMensagem(texto, ehErro = false) {
    mensagem.textContent = texto
    mensagem.className = ehErro ? 'erro' : 'sucesso'
}

function entrarModoEdicao(categoria) {
    idEmEdicao = categoria.id_categoria
    campoDescricao.value = categoria.descricao
    tituloForm.textContent = `Editar categoria #${categoria.id_categoria}`
    btnSalvar.textContent = 'Salvar'
    btnLimpar.textContent = 'Cancelar'
    campoDescricao.focus()
}

function sairModoEdicao() {
    idEmEdicao = null
    campoDescricao.value = ''
    tituloForm.textContent = 'Nova categoria'
    btnSalvar.textContent = 'Cadastrar'
    btnLimpar.textContent = 'Limpar'
}

btnLimpar.addEventListener('click', () => {
    const estavaEditando = idEmEdicao !== null
    sairModoEdicao()
    mensagem.textContent = estavaEditando ? 'Edição cancelada.' : ''
    mensagem.className = ''
    campoDescricao.focus()
})

async function carregarCategorias() {
    lista.innerHTML = '<li class="estado-lista">Carregando...</li>'
    try {
        const resposta = await fetch('/api/categorias')
        const categorias = await resposta.json()
        if (!resposta.ok) throw new Error(categorias.erro || 'Erro ao buscar categorias')

        lista.innerHTML = ''
        if (categorias.length === 0) {
            lista.innerHTML = '<li class="estado-lista">Nenhuma categoria cadastrada.</li>'
            return
        }

        for (const categoria of categorias) {
            const item = document.createElement('li')

            const info = document.createElement('div')
            info.className = 'categoria-info'

            const spanId = document.createElement('span')
            spanId.className = 'categoria-id'
            spanId.textContent = `#${categoria.id_categoria}`

            const spanNome = document.createElement('span')
            spanNome.className = 'categoria-nome'
            spanNome.textContent = categoria.descricao

            info.appendChild(spanId)
            info.appendChild(spanNome)

            const acoes = document.createElement('div')
            acoes.className = 'acoes'

            const btnEditar = document.createElement('button')
            btnEditar.type = 'button'
            btnEditar.className = 'btn-editar'
            btnEditar.textContent = 'Editar'
            btnEditar.addEventListener('click', () => entrarModoEdicao(categoria))

            const btnExcluir = document.createElement('button')
            btnExcluir.type = 'button'
            btnExcluir.className = 'btn-excluir'
            btnExcluir.textContent = 'Excluir'
            btnExcluir.addEventListener('click', () => excluirCategoria(categoria))

            acoes.appendChild(btnEditar)
            acoes.appendChild(btnExcluir)

            item.appendChild(info)
            item.appendChild(acoes)
            lista.appendChild(item)
        }
    } catch (erro) {
        lista.innerHTML = `<li class="estado-lista">Erro: ${erro.message}</li>`
    }
}

async function excluirCategoria(categoria) {
    const confirmou = confirm(`Deseja excluir a categoria "#${categoria.id_categoria} - ${categoria.descricao}"?`)
    if (!confirmou) return

    try {
        const resposta = await fetch(`/api/categorias/${categoria.id_categoria}`, {
            method: 'DELETE'
        })
        const dados = await resposta.json()

        if (!resposta.ok) {
            mostrarMensagem(`Erro ao excluir categoria: ${dados.erro || 'Erro desconhecido'}`, true)
            return
        }

        if (idEmEdicao === categoria.id_categoria) {
            sairModoEdicao()
        }

        mostrarMensagem(`Categoria "${categoria.descricao}" excluída!`)
        await carregarCategorias()
    } catch (erro) {
        mostrarMensagem(`Erro de conexão: ${erro.message}`, true)
    }
}

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    const descricao = campoDescricao.value.trim()

    if (!descricao) {
        mostrarMensagem('Descrição é obrigatória.', true)
        return
    }

    const editando = idEmEdicao !== null
    const url = editando ? `/api/categorias/${idEmEdicao}` : '/api/categorias'
    const metodo = editando ? 'PUT' : 'POST'

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descricao })
        })

        const dados = await resposta.json()

        if (resposta.ok) {
            if (editando) {
                mostrarMensagem(`Categoria #${dados.id_categoria} atualizada para "${dados.descricao}"!`)
                sairModoEdicao()
            } else {
                mostrarMensagem(`Categoria "${dados.descricao}" cadastrada!`)
                campoDescricao.value = ''
            }
            await carregarCategorias()
        } else {
            mostrarMensagem(`Erro: ${dados.erro || 'Erro desconhecido'}`, true)
        }
    } catch (erro) {
        mostrarMensagem(`Erro de conexão: ${erro.message}`, true)
    }
})

carregarCategorias()
