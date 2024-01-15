class NoteManager {
    constructor() {
        this.quill = null
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
                handler: function (range, context) {
                    this.quill.format('bold', !context.format.bold);
                }
            },
            italic: {
                key: 'I',
                shortKey: true,
                handler: function (range, context) {
                    this.quill.format('italic', !context.format.italic);
                }
            },
            underline: {
                key: 'U',
                shortKey: true,
                handler: function (range, context) {
                    this.quill.format('underline', !context.format.underline);
                }
            },
            strike: {
                key: 'S',
                shortKey: true,
                handler: function (range, context) {
                    this.quill.format('strike', !context.format.strike);
                }
            },
            clean: {
                key: 'Y',
                shortKey: true,
                handler: function (range) {
                    this.quill.removeFormat(range);
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
}