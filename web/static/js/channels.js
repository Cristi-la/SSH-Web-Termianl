const url = `ws://${window.location.host}/ws/session/${window.objectPk}`;
const secondUrl = `ws://${window.location.host}/ws/ssh/${window.objectPk}`;

const serverSocket = new WebSocket(url);

const sshServerSocket = new WebSocket(secondUrl)
const terminalManager = new TerminalManager();

serverSocket.onmessage = function(e){
    let data = JSON.parse(e.data);
    console.log('Data: ', data.message);
}

serverSocket.onopen = function () {
    console.log('connected');
}

sshServerSocket.onmessage = function(e) {
    let data = JSON.parse(e.data);

    if (data.message) {
        if (data.message.type && data.message.type === 'error') {
            terminalManager.writeMessage(data.message.error_message + '\n\r');
            // console.error("Error from server:", data.message.error_message);
            // console.error("Error details:", data.message.error_details);
        } else {
            terminalManager.writeMessage(data.message);
        }
    }
}

sshServerSocket.onopen = function () {
    terminalManager.createTerminal();
    terminalManager.openTerminal(document.getElementById('terminal'));
    terminalManager.setWebSocket(sshServerSocket);
}
