const conatiner = document.getElementById('container');
const note = document.getElementById('note');

var cm = CodeMirror(note, {
    value: "",
    mode: "javascript",
    lineNumbers: true,
    theme: 'base16-dark',
    smartIndent: true,
    electricChars: true,
    lineWrapping: true,
    indentUnit: 4,
});

cm.on("beforeChange", function(instance, change) {
    var lastLine = instance.lineCount() - 1;
    if (change.from.line < lastLine) {
        change.cancel();
    }
});

cm.on("keydown", function(instance, event) {
    if (event.key === "Enter") {
        event.preventDefault();
        var command = instance.getLine(instance.lineCount() - 1);
        executeSSHCommand(command);
    }
});

const hint = document.getElementById('cli_hint');
const cli = document.getElementById('cli');


cli.addEventListener("input", () =>{
    updateHint(cli, hint);
});


cli.addEventListener("keydown", function(event) {
    if (event.key === "Tab") {
        event.preventDefault();
        cliTabPressUpdate(cli, hint);
    }
    else if (event.key === "Enter") {
        const input = cli.value.trim();
        cli.value = '';

        if (input.startsWith("ssh ")) {
            sshConnect(input);
        }
    }
});