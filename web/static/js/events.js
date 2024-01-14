// Events
function emitSingleEvent(fun_name, args){
    if (window.parent)
        window.parent.postMessage({
            run: [
                {
                    function: fun_name, 
                    args: args,
                },
            ]
        })
}
function emitCloseEvent(session_id){
    console.log('session close event')
    emitSingleEvent('removeElementsForSession', [session_id])
}

function emitElementForSessionEvent(current_id, session_id, name, color){
    console.log('session update event')
    emitSingleEvent('updateElementForSession', [current_id, session_id, name, color])
}

function updateSaveSessionsEvent(){
    console.log('save session update event')
    emitSingleEvent('prepareSavedSessions', [2000])
}
