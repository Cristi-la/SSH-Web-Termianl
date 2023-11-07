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



// //////////////////
//      CLI
// ///////////////
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

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        cli.focus()
    }
});

// //////////////////
//      Tabs
// ///////////////
var sessions_data = [
    { session_id: 1, session_name: 'Mama Mateusza' },
    { session_id: 2, session_name: 'Tata Mateusza' },
    { session_id: 3, session_name: 'Mama Mateusza(1)' },
    { session_id: 4, session_name: 'Mateusz' },
];
loadSessions(sessions_data);