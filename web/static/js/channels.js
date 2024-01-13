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
                this.terminal.performResize()
            }
        };

        this.websocket.onmessage = (e) => {
            let data = JSON.parse(e.data);

            if (data.message) {
                switch (data.message.type) {
                    case 'error':
                        this.terminal.writeMessage(data.message.content + '\n\r');
                        break
                    case 'info':
                        this.terminal.writeMessage(data.message.content);
                        break
                    case 'action':
                        if (data.message.content.type === 'require_reconnect') {
                            createReconnectButton(data.message.content.session_saved, this.terminal)
                        } else if (data.message.content.type === 'reconnect_successful') {
                            removeReconnectButton();
                        }
                }
            }
        };
    }
}
