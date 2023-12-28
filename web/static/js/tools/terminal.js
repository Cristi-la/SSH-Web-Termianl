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
            this.handleWindowResize();
        });
    }

    handleWindowResize() {
        if (this.term) {
            this.resizeTerminal();
        }
    }

    resizeTerminal() {
        const geometry = this.currentGeometry();
        if (this.term && geometry.cols > 0 && geometry.rows > 0) {
            this.term.resize(geometry.cols, geometry.rows);
        }
    }

     currentGeometry() {
        try {
            this.getCellSize();
        } catch (TypeError) {
            this.parseXtermStyle()
        }

        const cols = parseInt(window.innerWidth / this.style.width, 10) - 1;
        const rows = parseInt(window.innerHeight / this.style.height, 10);
        return { cols, rows };
    }

     getCellSize() {
        if (this.term) {
            this.style.width = this.term._core._renderService._renderer.dimensions.actualCellWidth;
            this.style.height = this.term._core._renderService._renderer.dimensions.actualCellHeight;
        }
    }

    parseXtermStyle() {
        const text = document.querySelector('.xterm-helpers style').textContent;
        const widthMatch = text.match(/xterm-normal-char\{width:([0-9.]+)px\}/);
        const heightMatch = text.match(/div\{height:([0-9.]+)px\}/);

        if (widthMatch && heightMatch) {
            this.style.width = parseFloat(widthMatch[1]);
            this.style.height = parseFloat(heightMatch[1]);
        }
    }
}

function toggle_fullscreen(term) {
    $('#terminal .terminal').toggleClass('fullscreen');
    term.fitAddon.fit();
}

