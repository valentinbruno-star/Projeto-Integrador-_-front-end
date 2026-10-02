document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputElement = document.getElementById('userInput');
    const messageText = inputElement.value.trim();
    if (!messageText) return;

    const chatMessages = document.getElementById('chatMessages');

    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.textContent = messageText;
    chatMessages.appendChild(userDiv);
    inputElement.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('http://localhost:3000/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: messageText })
        });
        const data = await response.json();

        const botDiv = document.createElement('div');
        botDiv.className = 'message bot';
        botDiv.innerHTML = data.reply;
        chatMessages.appendChild(botDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error('Erro na comunicação com o chatbot:', error);
    }
});
