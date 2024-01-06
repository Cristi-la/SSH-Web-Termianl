function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}

function fetchData(method, url, data = {}) {
    // Get the CSRF token from the cookies
    const csrftoken = getCookie('csrftoken');

    data.csrfmiddlewaretoken = csrftoken

    // Make the POST request
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
        return await fetchData(method, url, data);
    } catch (error) {
        console.error('Error in getSessions:', error);
        return {};
    }
}

const getSession = async (session_id) => {
    try {
      const result = await getSessions();
      const sessions = result.sessions
      
      const session = sessions.find((session) => session.pk == parseInt(session_id));
      return session;
      
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
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
    emitSingleEvent('removeElementsForSession', [session_id])
}

// TODO IMPLEMENT IN FORMS....
function updateElementForSessionEvent(current_id, session_id, name){
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