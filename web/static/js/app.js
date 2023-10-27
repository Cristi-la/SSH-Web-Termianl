const conatiner = document.getElementById('container');
const note = document.getElementById('note');

var cm = CodeMirror(note, {
    value: "function myScript() {\n  return 100;\n}",
    mode: "javascript",
    lineNumbers: true,
    theme: 'base16-dark',
    smartIndent: true,
    electricChars: true,
    lineWrapping: true,
    indentUnit: 4,
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
});