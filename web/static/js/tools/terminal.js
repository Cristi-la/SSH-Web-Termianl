let terminalManager

document.addEventListener("DOMContentLoaded", function () {
    terminalManager = new TerminalManager();
    terminalManager.createTerminal();
    terminalManager.openTerminal(document.getElementById('terminal'));
    const form = document.querySelector('#ReconnectModal form');
    form.addEventListener('submit', handleFormSubmit);
    clearFormOnModalClose('ReconnectModal', 'form');
});

class TerminalManager {
    constructor() {
        this.term = null
        this.style = {width: null, height: null};
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
        window.addEventListener('resize', () => {
            if (this.term && this.term.fitAddon) {
                this.term.fitAddon.fit();
            }
        });
    }
}

function handleFormSubmit(event) {
    event.preventDefault();

    let formData = new FormData(event.target);
    let data = {};
    formData.forEach((value, key) => data[key] = value);

    let json = JSON.stringify({'action': 'reconnect', 'data': data});
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

function createReconnectButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary center-button';
    button.id = 'ReconnectButton';
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#ReconnectModal');

    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.setAttribute('xmlns', svgNamespace);
    svg.setAttribute('width', '32');
    svg.setAttribute('height', '32');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('class', 'bi bi-arrow-counterclockwise');
    svg.setAttribute('viewBox', '0 0 16 16');

    const path1 = document.createElementNS(svgNamespace, 'path');
    path1.setAttribute('fill-rule', 'evenodd');
    path1.setAttribute('d', 'M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z');

    const path2 = document.createElementNS(svgNamespace, 'path');
    path2.setAttribute('d', 'M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466');

    svg.appendChild(path1);
    svg.appendChild(path2);

    button.appendChild(svg);

    const container = document.getElementById('container');
    container.appendChild(button);
}

function removeReconnectButton() {
    const button = document.getElementById('ReconnectButton');
    if (button) {
        button.remove();
    }
}