const form = document.querySelector('#cliente')
const mensagem = document.querySelector('#mensagem')
const botao = document.querySelector('#btn-salvar')
form.addEventListener('submit', async evento => {
    evento.preventDefault()
    if (botao.disabled) return
    botao.disabled = true
    mensagem.textContent = 'Salvando…'
    try {
        const resposta = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
        })
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados.erro || 'Falha ao salvar.')
        form.reset()
        mensagem.textContent = 'Cliente cadastrado com sucesso.'
    } catch (erro) {
        mensagem.textContent = erro.message
    } finally {
        botao.disabled = false
    }
})
