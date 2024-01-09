let terminalManager

document.addEventListener("DOMContentLoaded", function () {
    terminalManager = new TerminalManager();
    terminalManager.createTerminal();
    terminalManager.openTerminal(document.getElementById('terminal'));
});

class TerminalManager {
    constructor() {
        this.term = null
        this.style = { width: null, height: null };
    }

    createTerminal() {
        let termOptions = {
            cursorBlink: true,
            theme: {
                background: 'black',
                foreground: 'white',
                cursor: 'white'
            }
        };

        let term = new window.Terminal(termOptions)

        term.fitAddon = new window.FitAddon.FitAddon()
        term.loadAddon(term.fitAddon)

        this.term = term;
    }

    openTerminal(container) {
        if (this.term && container) {
            this.term.open(container)
            document.querySelector('#terminal .terminal').classList.toggle('fullscreen');
            this.term.fitAddon.fit();
            this.term.focus()
            this.setupResizeListener();
        }
    }

    setWebSocket(socket) {
        this.socket = socket;

        if (this.term) {
            this.term.onData(data => {
                this.socket.send(JSON.stringify({'data': data}));
            });
        }
    }

    writeMessage(message) {
        this.term.write(message)
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            if (this.term && this.term.fitAddon) {
                this.term.fitAddon.fit();
            }
        });
    }
}

