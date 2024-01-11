class WebSocketManager {
    constructor(url, terminal) {
        this.websocket = new WebSocket(url);
        this.terminal = terminal;
    }

    setup() {
        this.websocket.onerror = (e) => {
            this.terminal.writeMessage('WebSocket connection error\n\r');
        };

        this.websocket.onopen = () => {
            if (this.terminal) {
                this.terminal.setWebSocket(this.websocket);
            }
        };

        this.websocket.onmessage = (e) => {
            let data = JSON.parse(e.data);

            if (data.message) {
                if (data.message.type === 'error') {
                    this.terminal.writeMessage(data.message.content + '\n\r');
                } else if (data.message.type === 'info') {
                    this.terminal.writeMessage(data.message.content);
                } else if (data.message.type === 'action' && data.message.content === 'require_reconnect') {
                    createReconnectButton();
                }  else if (data.message.type === 'action' && data.message.content === 'reconnect_successful') {
                    removeReconnectButton();
                }
            }
        };
    }
}
