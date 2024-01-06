function addTabToTabList(session_id, name) {

    if (document.getElementById(`nav-${session_id}-tab`)) return;

    // Get the #tablist element
    const tablist = document.getElementById('tablist');

    // Create a new button element
    const button = document.createElement('button');

    // Set the button attributes
    button.className = 'nav-link';
    button.id = `nav-${session_id}-tab`;
    button.setAttribute('data-bs-toggle', 'tab');
    button.setAttribute('data-bs-target', `#session-${session_id}`);
    button.type = 'button';
    button.role = 'tab';
    button.setAttribute('aria-controls', `nav-${session_id}`);
    button.setAttribute('aria-selected', 'false');
    button.textContent = name;

    // Append the button to the tablist
    tablist.prepend(button);
}

function removeTabFromTabList(session_id) {
    const buttonToRemove = document.getElementById(`nav-${session_id}-tab`);

    if (buttonToRemove) buttonToRemove.parentNode.removeChild(buttonToRemove);
}

function updateTabToTabList(current_id, session_id, name){
  const buttonToUpdate = document.getElementById(`nav-${session_id}-tab`);
  if (!buttonToRemove) return;

  if (current_id != session_id) buttonToUpdate.id = `nav-${session_id}-tab`
  if (name) button.textContent = name;

}


function addPanelTabToPanels(session_id, url) {
    if (document.getElementById(`session-${session_id}`))  return;

    // Create the div element
    const tabPane = document.createElement('div');
    tabPane.className = 'tab-pane fade';
    tabPane.id = `session-${session_id}`;
    tabPane.setAttribute('role', 'tabpanel');
    tabPane.setAttribute('aria-labelledby', `nav-${session_id}-tab`);
    tabPane.setAttribute('tabindex', '0');

    // Create the iframe element
    const iframe = document.createElement('iframe');
    iframe.src = url; // Make sure to replace this with the actual URL
    iframe.frameborder = '0';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.allowfullscreen = true;

    // Append the iframe to the tabPane
    tabPane.prepend(iframe);

    // Add the tabPane to the #tabpanel element
    const tabPanelElement = document.getElementById('tabpanel'); // Replace 'tabpanel' with your actual ID
    tabPanelElement.appendChild(tabPane);
}

function removePanelFromTabPanels(session_id) {
    const tabPane = document.getElementById(`session-${session_id}`);

    if (tabPane)  tabPane.remove(tabPane);
}

function updatePanelFromTabPanels(current_id, session_id){
  const tabPane = document.getElementById(`session-${session_id}`);
  if (!tabPane) return;

  if (current_id != session_id) tabPane.id = `nav-${session_id}-tab`
}

// GENERATE SESSION ELEMENTS
function addElementsForSession(session) {
    if (!session) return;

    addTabToTabList(session.pk, session.name);
    addPanelTabToPanels(session.pk, session.url);
    console.log('Created:',session)
}

function addElementsForSessions(sessions) {
    if (!sessions.length) return;

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

    if (buttonToShow) bootstrap.Tab.getOrCreateInstance(buttonToShow).show();

    console.log("Selected", sessions_id)
}

function chooseLastElementForSessions(sessions) {
    if (!sessions.length) return;
    
    chooseElementForSession(
        sessions[sessions.length-1].pk
    );
}

function updateElementForSession(current_id, session_id, name){
  updateTabToTabList(current_id, session_id, name)
  updatePanelFromTabPanels(current_id, session_id, name)
}

function addCreateTabPanels(url){
    removeElementsForSessions([{pk:'create'}])

    addTabToTabList('create', '*New');
    addPanelTabToPanels('create', url);
    chooseElementForSession('create');
}


window.addEventListener('message', function(event) {
    console.log(event.data)

    // Check the origin of the sender (replace "http://child-iframe.com" with the actual origin of your iframe)
    if (event.origin !== this.window.location.origin) {

      console.warn('Ignoring message from unexpected origin:', event.origin);
      return;
    }
  
    // Check if the message contains the 'run' property
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