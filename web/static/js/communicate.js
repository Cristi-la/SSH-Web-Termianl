var session_list = []
var saved_session_list = []
var samples = []

function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}

function fetchData(method, url, data = {}) {
    const csrftoken = getCookie('csrftoken');
    data.csrfmiddlewaretoken = csrftoken;

    console.log('data', data);

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, false);  // Synchronous request
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-CSRFToken', csrftoken);

    let result;

    try {
        xhr.send(JSON.stringify(data));

        if (xhr.status >= 200 && xhr.status < 300) {
            result = JSON.parse(xhr.responseText);
            console.log('Success:', result);
        } else {
            console.error('Error:', xhr.statusText);
            throw new Error(xhr.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }

    return result;
}

function getSessions(){
    const method = 'POST';
    const url = window.location.href;
    const data = {};

    try {
        const result = fetchData(method, url, data);
        if (!result.sessions) return []

        session_list = result.sessions

        return session_list
    } catch (error) {
        console.error('Error in getSessions:', error);
        return {};
    }
}

function getSession(session_id, force=false) {
    if (!force){
        if (session_list){
            let mysession = session_list.find((session) => parseInt(session.pk) === parseInt(session_id));
            if (mysession) return mysession;
        }
    }

    const method = 'POST';
    const url = window.location.href;
    const data = {sid: session_id};
    try {
        const result = fetchData(method, url, data);
        const tmp_session_list = result.sessions
        const mysession = tmp_session_list.find((session) => parseInt(session.pk) === parseInt(session_id));

        const indx = session_list.findIndex((session) => parseInt(session.pk) === parseInt(session_id));

        if (indx == -1) {
            session_list.push(mysession)
        } else {
            session_list[indx] = mysession
        }

        return mysession;
    } catch (error) {
        console.error('Error in getSession:', error);
        
    }
    return null;
};

function getSavedSessions() {
    const method = 'PATCH';
    const url = window.location.href;
    try {
        const result = fetchData(method, url);
        saved_session_list = result.saved_sessions
        samples = result.samples

        return saved_session_list;
    } catch (error) {
        console.error('Error in getSession:', error);
        
    }
};
function openSavedSessions(save_session_id) {
    const method = 'PUT';
    const url = window.location.href;
    const data = {save_session: save_session_id}

    try {
        const result = fetchData(method, url, data);
        return result.session_id;
    } catch (error) {
        console.error('Error in getSession:', error);
        
    }
};


// function deleteCurrentSession() {
//     const method = 'DELETE';
//     const url = window.location.href;

//     try {
//         return fetchData(method, url);
//     } catch (error) {
//         console.error('Error in deleteCurrentSession:', error);
//         return null;
//     }
// }

function deleteSession(session_id) {
    const session = getSession(session_id)
    const method = 'DELETE';
    const url = session.url;

    try {
        return fetchData(method, url);
    } catch (error) {
        console.error('Error in deleteSession:', error);
        return null;
    }
}

function deleteAllSessions() {
    const method = 'DELETE';
    const url = window.location.href;

    try {
        return fetchData(method, url);
    } catch (error) {
        console.error('Error in deleteAllSessions:', error);
        return null;
    }
}

function deleteSaveSession(save_session_id) {
    const method = 'DELETE';
    const url = window.location.href;
    const data = {save_session: save_session_id}

    try {
        return fetchData(method, url, data);
    } catch (error) {
        console.error('Error in deleteSaveSession:', error);
        return null;
    }
}


function updateSession(session_id, name, color){
    const session = getSession(session_id)
    const url = session.url;
    const method = 'PATCH';
    let data = {
        'name': name,
        'color': color,
    };

    data = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== null && value !== '' && value !== undefined)
    );

    __update_session(session_id, data)

    try {
        return fetchData(method, url, data);
    } catch (error) {
        console.error('Error in updateSession:', error);
        return null;
    }
}

function __update_session(session_id, data){
    let index = session_list.findIndex((session) => parseInt(session.pk) === parseInt(session_id));
    console.log('Update sesion data:', session_id, index)
    if (index == -1) return;
    
    for (const key in data) {
        session_list[index][key] = data[key];
    }
}


function joinSession(session_key) {
    const method = 'PUT';
    const url = window.location.href;
    const data = {session_key: session_key}

    try {
        return fetchData(method, url, data);
    } catch (error) {
        console.error('Error in joinSession:', error);
        return null;
    }
}

function shareSession(session_id, get=false){
    const session = getSession(session_id)
    const method = 'POST';
    const url = session.url;
    const data = {share: !session.session_open, get: get};

    try {
        const result = fetchData(method, url, data);
        return result
    } catch (error) {
        console.error('Error in shareSession:', error);
        return null;
    }
}