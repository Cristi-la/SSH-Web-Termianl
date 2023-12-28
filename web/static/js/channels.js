const url = `ws://${window.location.host}/ws/socket-server/`;
const groupName = '1';
const secondUrl = `ws://${window.location.host}/ws/ssh-socket/?group=${groupName}`;

const serverSocket = new WebSocket(url);

const sshServerSocket = new WebSocket(secondUrl)
const terminalManager = new TerminalManager();

serverSocket.onmessage = function(e){
    let data = JSON.parse(e.data);
    console.log('Data', data);
}

sshServerSocket.onmessage = function(e){
    let data = JSON.parse(e.data)
    if (data.message != null) {
        terminalManager.writeMessage(data.message);
    }
}

sshServerSocket.onopen = function () {
    terminalManager.createTerminal();
    terminalManager.openTerminal(document.getElementById('terminal'));
    terminalManager.setWebSocket(sshServerSocket);
}
