class TerminalManager {
    constructor() {
        this.term = null
        this.fitAddon = null
        this.termContentLoadedFromDb = false
        this.socket = null
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

        this.fitAddon = new window.FitAddon.FitAddon()
        term.loadAddon(this.fitAddon)

        this.term = term;
    }

    openTerminal(container) {
        if (this.term && container) {
            this.term.open(container)
            document.querySelector('#terminal .terminal').classList.toggle('fullscreen');
            this.fitAddon.fit();
            this.term.focus()
            this.setupResizeListener();
        }
    }

    setWebSocket(socket) {
        this.socket = socket;

        if (this.term) {
            this.term.onData(data => {
                this.sendData(JSON.stringify({'action': 'execute', 'data': data}));
            });
        }
    }

    sendData(data_json) {
        this.socket.send(data_json);
    }

    writeMessage(message) {
        this.term.write(message)
    }

    setupResizeListener() {
        let resizeTimer;
        const resizeFunction = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (this.term && this.fitAddon) {
                    this.performResize();
                }
            }, 300);
        };

        window.addEventListener('resize', resizeFunction);
        window.addEventListener('beforeunload', resizeFunction);
    }

    performResize() {
        if (this.term && this.fitAddon) {
            this.delTermSize()

            this.fitAddon.fit();

            const NewCols = this.term.cols;
            const NewRows = this.term.rows;
            this.sendData(JSON.stringify({'action': 'resize', 'type': 'new', 'data': {'cols': NewCols, 'rows': NewRows}}));
        }
    }

    delTermSize() {
        const Cols = this.term.cols;
        const Rows = this.term.rows;
        this.sendData(JSON.stringify({'action': 'resize', 'type': 'del', 'data': {'cols': Cols, 'rows': Rows}}));
    }
}

function handleFormSubmit(event, terminalManager) {
    event.preventDefault();

    let formData = new FormData(event.target);
    let data = {};
    formData.forEach((value, key) => data[key] = value);

    let json = JSON.stringify({'action': 'reconnect', 'type': 'form', 'data': data});
    terminalManager.sendData(json);

    event.target.reset();

    let modalElement = document.getElementById('ReconnectModal');
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
}

function clearFormOnModalClose(modalId, formSelector) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        const form = modalElement.querySelector(formSelector);
        modalElement.addEventListener('hide.bs.modal', () => {
            if (form) {
                form.reset();
            }
        });
    }
}

function createReconnectButton(savedSession, terminalManager) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary center-button';
    button.id = 'ReconnectButton';

    const img = document.createElement('img');
    img.setAttribute('src', '/static/images/reconnect.svg');
    img.setAttribute('fill', '#FFFFFF');
    img.setAttribute('width', '32');
    img.setAttribute('height', '32');
    img.setAttribute('alt', 'Reconnect');

    button.appendChild(img);

    if (savedSession === false) {
        button.setAttribute('data-bs-toggle', 'modal');
        button.setAttribute('data-bs-target', '#ReconnectModal');
    } else if (savedSession === true) {
        button.addEventListener('click', function() {
        let json = JSON.stringify({'action': 'reconnect', 'type': 'saved'});
        terminalManager.sendData(json);
    });
    }

    const container = document.getElementById('container');
    container.appendChild(button);
}

function removeReconnectButton() {
    const reconnectButton = document.getElementById('ReconnectButton');

    if (reconnectButton) {
        reconnectButton.remove();
    }
}