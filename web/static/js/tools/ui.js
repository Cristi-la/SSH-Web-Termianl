
TAB_CLASSES = "badge rounded-pill disable_selection from-tab mx-1"
const tabs = document.getElementById('tabs');

function loadSessions(sessions_data) {
    sessions_data.forEach((session) => {
        addTab(session)
    });
}

function generateCloseTab(session){
    const cls = document.createElement('span');
    cls.classList.add('from-tab-close');
    cls.textContent = 'X';

    cls.addEventListener('click', (e) => {
        removeTab(session.session_id)
    });
    return cls
}

function generateTab(session){
    const btn = document.createElement('span');
    const cls = generateCloseTab(session);
    
    btn.classList = TAB_CLASSES;
    btn.setAttribute('data-session-id', session.session_id);
    btn.textContent = session.session_name;
    btn.appendChild(cls);

    return btn
}


function addTab(session) {
    const button = generateTab(session);
    tabs.appendChild(button);
}

function removeTab(session_id) {
    const buttons = document.querySelectorAll(`[data-session-id="${session_id}"]`);

    buttons.forEach((button) => {
        button.remove();
    });
}


