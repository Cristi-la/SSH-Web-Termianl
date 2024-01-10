const url = `ws://${window.location.host}/ws/session/${window.UserobjectPk}`;

const serverSocket = new WebSocket(url);

serverSocket.onerror = function(e) {
    terminalManager.writeMessage('WebSocket connection error\n\r')
};

serverSocket.onopen = function () {
    terminalManager.setWebSocket(serverSocket);
}

serverSocket.onmessage = function(e) {
    let data = JSON.parse(e.data);

    if (data.message) {
        if (data.message.type === 'error') {
            terminalManager.writeMessage(data.message.content + '\n\r');
        } else if (data.message.type === 'info') {
            terminalManager.writeMessage(data.message.content);
        } else if (data.message.type === 'action' && data.message.content === 'require_reconnect') {
            createReconnectButton()
        }  else if (data.message.type === 'action' && data.message.content === 'reconnect_successful') {
            removeReconnectButton()
        }
    }
}

