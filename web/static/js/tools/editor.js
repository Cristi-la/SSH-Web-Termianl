class NoteManager {
    constructor() {
        this.quill = null
        this.socket = null
    }

    createEditor() {
        const toolbarOptions = [
            [{'undo': ''}, {'redo': ''}],
            [{'size': ['small', false, 'large', 'huge']}, {'header': [1, 2, 3, 4, 5, 6, false]}],
            ['bold', 'italic', 'underline', 'strike'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{'indent': '-1'}, {'indent': '+1'}, {'align': []}],
            [{'font': []}, {'color': []}, {'background': []}],
            ['blockquote', 'code-block'],
            ['clean']
        ];

        const icons = Quill.import("ui/icons");
        icons['undo'] = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-bar-left" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5M10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5"/>
        </svg>`;

        icons['redo'] = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-bar-right" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8m-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5"/>
        </svg>`;

        const customBindings = {
            bold: {
                key: 'B',
                shortKey: true,
                handler: (range, context) => {
                    this.quill.format('bold', !context.format.bold);
                    if (range && range.length > 0) {
                        this.sendFormatChangeInfo('bold', !context.format.bold, range.index, range.length);
                    }
                }
            },
            italic: {
                key: 'I',
                shortKey: true,
                handler: (range, context) => {
                    this.quill.format('italic', !context.format.italic);
                    if (range && range.length > 0) {
                        this.sendFormatChangeInfo('italic', !context.format.italic, range.index, range.length);
                    }
                }
            },
            underline: {
                key: 'U',
                shortKey: true,
                handler: (range, context) => {
                    this.quill.format('underline', !context.format.underline);
                    if (range && range.length > 0) {
                        this.sendFormatChangeInfo('underline', !context.format.underline, range.index, range.length);
                    }
                }
            },
            strike: {
                key: 'S',
                shortKey: true,
                handler: (range, context) => {
                    this.quill.format('strike', !context.format.strike);
                    if (range && range.length > 0) {
                        this.sendFormatChangeInfo('strike', !context.format.strike, range.index, range.length);
                    }
                }
            },
            clean: {
                key: 'Y',
                shortKey: true,
                handler: (range) => {
                    this.quill.removeFormat(range);
                    if (range && range.length > 0) {
                        this.sendFormatChangeInfo('default', null, range.index, range.length);
                    }
                }
            }
        }

        this.quill = new Quill('#editor', {
            modules: {
                toolbar: toolbarOptions,
                keyboard: {
                    bindings: customBindings
                },
                history: {
                    delay: 1000,
                    maxStack: 1000,
                }
            },
            scrollingContainer: '#editor-container',
            theme: 'snow'
        });

        this.addToolTips();
        this.addUndoRedoListeners();
        this.trackTextChanges();
        this.trackHighlightAndFormatting()
    }

    addUndoRedoListeners() {
        const undoButton = document.querySelector('.ql-toolbar .ql-undo');
        const redoButton = document.querySelector('.ql-toolbar .ql-redo');

        if (undoButton) {
            undoButton.addEventListener('click', () => {
                this.quill.history.undo();
            });
        }

        if (redoButton) {
            redoButton.addEventListener('click', () => {
                this.quill.history.redo();
            });
        }
    }

    addToolTips() {
        const tooltips = {
            'undo': 'Undo changes',
            'redo': 'Redo changes',
            'bold': 'Bold (Ctrl + B)',
            'italic': 'Italic (Ctrl + I)',
            'underline': 'Underline (Ctrl + U)',
            'strike': 'Strikethrough (Ctrl + S)',
            'clean': 'Remove Formatting (Ctrl + Y)',
            'align': 'Text alignment',
            'header': 'Header',
            'size': 'Font size',
            'font': 'Font style',
            'color': 'Font color',
            'background': 'Font background color',
            'blockquote': 'Blockquote',
            'code-block': 'Code Block',
        };

        Object.keys(tooltips).forEach(key => {
            const button = document.querySelector(`.ql-${key}`);
            if (button) {
                button.title = tooltips[key];
            }
        });

        const indentButtons = document.querySelectorAll('.ql-indent');
        indentButtons.forEach(button => {
            if (button.value === '-1') {
                button.title = 'Add indent';
            } else if (button.value === '+1') {
                button.title = 'Remove indent';
            }
        });

        const listButtons = document.querySelectorAll('.ql-list');
        listButtons.forEach(button => {
            if (button.value === 'ordered') {
                button.title = 'Ordered List';
            } else if (button.value === 'bullet') {
                button.title = 'Bullet List';
            }
        });

    }

    trackTextChanges() {
        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                delta.ops.forEach(op => {
                    if (op.insert) {
                        if (typeof op.insert === 'string') {
                            let index = this.calculateIndex(delta, op);
                            let formats = this.quill.getFormat(index, op.insert.length);
                            this.sendData(JSON.stringify({
                                'action': 'insert',
                                'data': {'text': op.insert, 'index': index}
                            }))
                            this.sendData(JSON.stringify({'action': 'update_content',
                                'data': {'delta': this.getDelta()}
                            }))

                            if (Object.keys(formats).length === 0) {
                                this.sendFormatChangeInfo('default', null, index, op.insert.length);
                            } else {
                                for (let format in formats) {
                                    this.sendFormatChangeInfo(format, formats[format], index, op.insert.length);
                                }
                            }
                        }
                    } else if (op.delete) {
                        let index = this.calculateIndex(delta, op);
                        this.sendData(JSON.stringify({
                            'action': 'delete',
                            'data': {'length': op.delete, 'index': index}
                        }))
                        this.sendData(JSON.stringify({'action': 'update_content',
                                'data': {'delta': this.getDelta()}
                            }))
                    }
                });
            }
        });
    }

    calculateIndex(delta, op) {
        let index = 0;
        for (let d of delta.ops) {
            if (d === op) {
                break;
            }
            if (d.retain) {
                index += d.retain;
            } else if (d.insert) {
                index += (typeof d.insert === 'string') ? d.insert.length : 1;
            }
        }
        return index;
    }

    setWebSocket(socket) {
        this.socket = socket;
    }

    sendData(data_json) {
        this.socket.send(data_json);
    }

    insertText(text, index) {
        this.quill.insertText(index, text);
    }

    deleteText(length, index) {
        if (length > 0) {
            this.quill.deleteText(index, length);
        }
    }

    trackHighlightAndFormatting() {
        let currentFormats = {};

        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                let currentIndex = 0;
                delta.ops.forEach((op) => {
                    if (op.retain) {
                        currentIndex += op.retain;
                        if (op.attributes) {
                            this.handleAttributeChange(op.attributes, currentIndex - op.retain, op.retain);
                            currentFormats = {...currentFormats, ...op.attributes};
                        } else {
                            this.handleFormatRemoval(currentFormats, currentIndex - op.retain, op.retain);
                            currentFormats = {};
                        }
                    } else if (op.insert) {
                        if (typeof op.insert === 'string') {
                            this.handleTextInsertion(currentFormats, currentIndex, op.insert);
                            currentIndex += op.insert.length;
                        }
                    }
                });
            }
        });
    }

    sendFormatChangeInfo(format, value, index, length) {
        const data = {
            action: 'format-change',
            data: {
                format_type: format,
                value: value,
                index: index,
                length: length
            }
        };

        this.sendData(JSON.stringify(data))
        this.sendData(JSON.stringify({
            'action': 'update_content',
            'data': {'delta': this.getDelta()}
        }))
    }

    applyFormatChanges(format, value, index, length) {
        if (index == null || length == null || format == null) {
            return;
        }

        if (format === 'default') {
            this.quill.removeFormat(index, length);
        } else {
            this.quill.formatText(index, length, {[format]: value});
        }
    }

    handleTextInsertion(currentFormats, index, text) {
        if (Object.keys(currentFormats).length > 0) {
            for (let format in currentFormats) {
                this.sendFormatChangeInfo(format, currentFormats[format], index, text.length);
            }
        }
    }

    handleFormatRemoval(currentFormats, index, length) {
        for (let format in currentFormats) {
            if (!currentFormats[format]) {
                this.sendFormatChangeInfo(format, false, index, length);
            }
        }
    }

    handleAttributeChange(attributes, index, length) {
        for (let format in attributes) {
            this.sendFormatChangeInfo(format, attributes[format], index, length);
        }
    }

    loadDelta(delta) {
        this.quill.setContents(delta);
    }

    getDelta() {
        return this.quill.getContents()
    }
}