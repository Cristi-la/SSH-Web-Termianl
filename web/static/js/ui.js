function __createInputField(button, session_id) {
  const input = document.createElement('input');
  input.type = 'text';
  const buttonWidth = button.offsetWidth;
  input.style.width = buttonWidth + 'px';
  input.className = 'form-control input-on-dblclick nav-link active text-center';
  input.value = button.textContent;
  button.replaceWith(input);
  input.focus();

  input.addEventListener('change', function () {
    __replaceInputWithButton(input, button, session_id);
  });
  input.addEventListener('blur', function () {
    __replaceInputWithButton(input, button, session_id);
  });

  input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        __replaceInputWithButton(input, button, session_id);
      }
  });
}
function __replaceInputWithButton(input, button, session_id) {
  if (button.textContent == input.value) return;

  if (input.value) {
    button.textContent = input.value;
    updateSession(session_id, input.value)
  }

  input.replaceWith(button);
}

function addTabToTabList(session_id, name) {

    if (document.getElementById(`nav-${session_id}-tab`)) return;

    // Get the #tablist element
    const tablist = document.getElementById('tablist');

    // Create a new button element
    const button = document.createElement('button');

    // Set the button attributes
    button.className = 'nav-link text-truncate';
    button.id = `nav-${session_id}-tab`;
    button.setAttribute('data-bs-toggle', 'tab');
    button.setAttribute('data-bs-target', `#session-${session_id}`);
    button.type = 'button';
    button.role = 'tab';
    button.setAttribute('aria-controls', `nav-${session_id}`);
    button.setAttribute('aria-selected', 'false');
    button.textContent = name;
    button.addEventListener('dblclick', function () {
      if (this.id == `nav-create-tab`) return;
      __createInputField(button, session_id);
    });

    // Append the button to the tablist
    tablist.prepend(button);
}

function removeTabFromTabList(session_id) {
    const buttonToRemove = document.getElementById(`nav-${session_id}-tab`);

    if (buttonToRemove) buttonToRemove.remove();
}

function updateTabToTabList(current_id, session_id, name){
  if (current_id == session_id || !current_id) return;

  const currentBtn = document.getElementById(`nav-${current_id}-tab`);
  const newBtn = document.getElementById(`nav-${session_id}-tab`);
  if (!currentBtn || newBtn) return;

  if (session_id) {
    currentBtn.id = `nav-${session_id}-tab`
    currentBtn.setAttribute('data-bs-target', `#session-${session_id}`);
    currentBtn.setAttribute('aria-controls', `nav-${session_id}`);
  }
  if (name) currentBtn.textContent = name;

}


function addPanelTabToPanels(session_id, url) {
    if (document.getElementById(`session-${session_id}`))  return;

    const tabPane = document.createElement('div');
    tabPane.className = 'tab-pane fade bg-dark rounded border-slate-800 ';
    tabPane.id = `session-${session_id}`;
    tabPane.setAttribute('role', 'tabpanel');
    tabPane.setAttribute('aria-labelledby', `nav-${session_id}-tab`);
    tabPane.setAttribute('tabindex', '0');

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.frameborder = '0';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.allowfullscreen = true;

    tabPane.prepend(iframe);

    const tabPanelElement = document.getElementById('tabpanel'); 
    tabPanelElement.appendChild(tabPane);
}

function removePanelFromTabPanels(session_id) {
    const tabPane = document.getElementById(`session-${session_id}`);

    if (tabPane)  tabPane.remove();
}

function updatePanelFromTabPanels(current_id, session_id){
  if (current_id == session_id || !current_id) return;

  const currnetTabPane = document.getElementById(`session-${current_id}`);
  const newTabPane = document.getElementById(`session-${session_id}`);

  console.log('currnetTabPane', currnetTabPane)
  console.log('newTabPane', newTabPane)
  if (!currnetTabPane || newTabPane) return;

  if (session_id) {
    currnetTabPane.id = `session-${session_id}`
    currnetTabPane.setAttribute('aria-labelledby', `nav-${session_id}-tab`);
  }

  console.log('new id', currnetTabPane.id)
}

function addElementsForSession(session) {
    if (!session) return;

    addTabToTabList(session.pk, session.name);
    addPanelTabToPanels(session.pk, session.url);
    console.log('Created:',session)
}

function addElementsForSessions(sessions) {
    if (!sessions.length) {
      addCreateTabPanels();
      return;
    }

    sessions.forEach(session => {
        addElementsForSession(session)
    });
}
function removeElementsForSession(sessions_id) {
    if (!sessions_id) return;

    removeTabFromTabList(sessions_id);
    removePanelFromTabPanels(sessions_id);
    console.log('Removed',sessions_id)
}


function removeElementsForSessions(sessions) {
    if (!sessions.length) return;
    sessions.forEach(session => {
        removeElementsForSession(session.pk)
    });
}

function chooseElementForSession(sessions_id) {
    const buttonToShow = document.getElementById(`nav-${sessions_id}-tab`);

    if (buttonToShow) {
      bootstrap.Tab.getOrCreateInstance(buttonToShow).show();
      console.log("Selected", sessions_id)
    }
}

function chooseLastElementForSessions(sessions) {
    if (!sessions.length) return;
    
    chooseElementForSession(
        sessions[sessions.length-1].pk
    );
}

function updateElementForSession(current_id, session_id, name){
  updateTabToTabList(current_id, session_id, name)
  updatePanelFromTabPanels(current_id, session_id)
}

function addCreateTabPanels(){
    removeElementsForSessions([{pk:'create'}])

    addTabToTabList('create', '*New');
    addPanelTabToPanels('create', '/create');
    chooseElementForSession('create');
}


window.addEventListener('message', function(event) {
    console.log(event.data)

    if (event.origin !== this.window.location.origin) {

      console.warn('Ignoring message from unexpected origin:', event.origin);
      return;
    }

    if (event.data && event.data.run && Array.isArray(event.data.run)) {
      event.data.run.forEach(function(runConfig) {
        if (runConfig.function && typeof runConfig.function === 'string') {
          if (typeof window[runConfig.function] === 'function') {
            window[runConfig.function].apply(null, runConfig.args);
          } else {
            console.error('Function not found:', runConfig.function);
          }
        } else {
          console.error('Invalid function configuration:', runConfig);
        }
      });
    } else {
      console.error('Invalid message format:', event.data);
    }
  });