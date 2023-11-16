const commands = [
    {
        alias: 'help',
        action: () => {},
        help: "",
        tree: [
            {
                varible: '<DUPA>',
                action: () => {},
                help: "",
            },
        ]
    },
    {
        alias: 'jhfh',
        action: () => {},
        tree: [
            {
                alias: 'help',
            },
        ]
    },
    {
        alias: 'mateusz',
        tree: [
            {
                alias: 'jest',
            },
            {
                alias: 'robi',
                tree: [
                    {
                        alias: 'loda',
                    },
                    {
                        alias: 'notatki',
                    },
                    {
                        alias: 'obiad',
                        tree: [
                            {
                                alias: "z",
                                tree: [
                                    {
                                        alias: "dyni"
                                    }
                                ]
                            }
                        ]
                    },
                ],
            },
        ]
    },
];

var interuptedComboOptions = true


function updateHint(cli, hint) {
    interuptedComboOptions = true
    cli.value = cli.value.replace(/\s\s/g, ' ');

    let command = cli.value.toLowerCase();
    let parts = command.trim().split(/\s+/);
    let currentlevel = 0
    let currentCommands = commands;
    let hints = []
    
    while (true) {
        currentPart = parts[currentlevel];
        currentCommands = findMatchingCommands(currentPart, currentCommands);

        if (!currentCommands.length) break;


        if (currentlevel >= 1 && !currentPart && currentCommands.length > 1) {
            matchedHint = currentCommands.map(command => command.alias)
            matchedHintText = matchedHint.join("|")
            hints.push(`[${matchedHintText}]`);
        } else { 
            hints.push(currentCommands[0].alias); 
        }

        // console.log("lvl", currentlevel)
        // console.log("root", currentCommands)
        // console.log("tree", currentCommands.tree)
        // console.log("part", currentPart)
        // console.log("hints", hints)
        // console.log('----')

        if (currentCommands.length > 1 || 
            (currentCommands.length === 1 && 
                (currentCommands[0].alias.toLowerCase() !== currentPart) || !currentCommands[0].tree)) break;

        currentCommands = currentCommands[0].tree
        currentlevel++
    }

    hint.textContent = hints.join(' ')
}

function findMatchingCommands(part, currentCommands) {
    if (!part) return currentCommands

    let matchingCommands = [];
    
    for (const command of currentCommands) {
        if (command.alias.toLowerCase() === part ) {
            return [command]
        }
        else if (command.alias.toLowerCase().startsWith(part)) {
            matchingCommands.push(command);
        }
    }
    
    return matchingCommands;
}





//  Tab button functionality
var savedComboOptions = []
var savedValueText = ''
var comboOptionIndex = 0
const comboOptionRegex = /[\[\]]/;
//currenthintChoice
//currenthintChoiceText

function convertComboOptions(element) {
    return element
            .replace("[", "") // Remove the opening bracket
            .replace("]", "") // Remove the closing bracket
            .split("|") // Split by comma and space
            .filter(Boolean);
}

function getComboOptions(currentHintChoiceText){
    let currentHintChoice = currentHintChoiceText.split(/\s+/)

    if (!currentHintChoice.length) return []

    if (!comboOptionRegex.test(currentHintChoiceText)) return [currentHintChoice[-1]]

    console.log("currentHintChoice",currentHintChoice[currentHintChoice.length -1])
    return convertComboOptions(currentHintChoice[currentHintChoice.length -1])
}


function resetSavedComboOption(cli, hint){
    savedComboOptions = []
    comboOptionIndex = 0
    savedValueText = ''
    updateHint(cli, hint)
}

  
function cliTabPressUpdate(cli, hint) {
    let currentHintChoiceText = hint.textContent
    let currentValueText = cli.value
    let comboOptions = []

    // reset multple combo option handler
    if (interuptedComboOptions) {
        resetSavedComboOption(cli, hint)
        // no hint to tabulate
        if (currentValueText.length > currentHintChoiceText.length) return
    } 
    // else if (currentValueText.length > currentHintChoiceText.length) return    

    // get combo options
    if (interuptedComboOptions) {
        comboOptions = getComboOptions(currentHintChoiceText)
        savedComboOptions = comboOptions
        savedValueText = currentValueText
    } else comboOptions = savedComboOptions 

    
    // no combo options
    if (!comboOptions.length) return

    console.log('test1')

    if (comboOptions.length == 1) {
        cli.value = currentHintChoiceText
        updateHint(cli, hint)
        return;
    }

    // Hande multiple combo options
    if (comboOptions.length < comboOptionIndex + 1) comboOptionIndex = 0

    cli.value = savedValueText + ' ' + comboOptions[comboOptionIndex]
    hint.textContent = savedValueText
    comboOptionIndex = comboOptionIndex + 1;
    interuptedComboOptions = false

    cli.value = cli.value.replace(/\s\s/g, ' ');

    // console.log("comboOptionIndex", comboOptionIndex)
    // console.log("interuptedComboOptions", interuptedComboOptions)
    // console.log("comboOptions",comboOptions)
    
}


function loadCli(){
    const hint = document.getElementById('cli_hint');
    const cli = document.getElementById('cli');


    cli.addEventListener("input", () =>{
        updateHint(cli, hint);
    });


    // cli.addEventListener("keydown", function(event) {
    //     if (event.key === "Tab") {
    //         event.preventDefault();
    //         cliTabPressUpdate(cli, hint);
    //     }
    // });

    // document.addEventListener('keydown', (event) => {
    //     if (event.ctrlKey && event.key === 'k') {
    //         event.preventDefault();
    //         cli.focus()
    //     }
    // });
}




