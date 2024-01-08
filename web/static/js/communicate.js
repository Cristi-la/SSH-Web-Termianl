var session_list = []

function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}

async function fetchData(method, url, data = {}) {
    const csrftoken = getCookie('csrftoken');
    data.csrfmiddlewaretoken = csrftoken

    console.log('data', data)
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        console.log('Success:', result);
        return result;
    })
    .catch(error => {
        console.error('Error:', error);
        throw error;
    });
}

const getSessions = async () => {
    const method = 'POST';
    const url = window.location.href;
    const data = {};

    try {
        const result = await fetchData(method, url, data);
        if (!result.sessions) return []

        session_list = result.sessions

        return session_list
    } catch (error) {
        console.error('Error in getSessions:', error);
        return {};
    }
}

const getSession = async (session_id) => {
    let session = session_list.find((session) => parseInt(session.pk) === parseInt(session_id));

    if (session) return session;

    const method = 'POST';
    const url = window.location.href;
    var data = {sid: session_id};
    try {
        const result = await fetchData(method, url, data);
        const sessions = result.sessions
        return sessions.find((session) => parseInt(session.pk) === parseInt(session_id));
    } catch (error) {
        console.error('Error in getSession:', error);
        
    }
    return null;
};


const deleteCurrentSession = async () => {
    const method = 'DELETE';
    const url = window.location.href;
    const data = {};

    try {
        return await fetchData(method, url, data);
    } catch (error) {
        console.error('Error in deleteCurrentSession:', error);
        return null;
    }
}

const updateSession = async (session_id, name) => {
    const session = await getSession(session_id)
    const url = session.url;
    const method = 'PATCH';
    const data = {'name': name};

    try {
        return await fetchData(method, url, data);
    } catch (error) {
        console.error('Error in updateSession:', error);
        return null;
    }
}

/// bootstrap
function closeAllDropDowns(){
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
    const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl))
    dropdownList.forEach(element => element.hide())
}

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

function emitElementForSessionEvent(current_id, session_id, name){
    console.log('session update event')
    emitSingleEvent('updateElementForSession', [current_id, session_id, name])
}

// window.addEventListener("load", (e) => {
//     document.querySelectorAll(ELEMENT_ID_CLOSE).forEach((element) => {
//         element.addEventListener('click', (e) => {
//             id = e.target.getAttribute('data-session-id')

//             if (id) emitCloseEvent(id)
//         });
//     });
// });