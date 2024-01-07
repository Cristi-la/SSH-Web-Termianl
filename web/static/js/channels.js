const url = `ws://${window.location.host}/ws/session/${window.objectPk}`;

const serverSocket = new WebSocket(url);

serverSocket.onerror = function(e) {
    terminalManager.writeMessage('WebSocket connection error\n\r')
    console.log(terminalManager)
};

serverSocket.onopen = function () {
    terminalManager.setWebSocket(serverSocket);
}

serverSocket.onmessage = function(e) {
    let data = JSON.parse(e.data);

    if (data.message) {
        if (data.message.type === 'error') {
            terminalManager.writeMessage(data.message.error_message + '\n\r');
        } else if (data.message.type === 'info') {
            terminalManager.writeMessage(data.message.content);
        }
    }
}

