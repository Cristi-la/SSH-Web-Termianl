
function __formatData(date_str){
  const originalDate = new Date(date_str);

  const year = originalDate.getFullYear();
  const month = (originalDate.getMonth() + 1).toString().padStart(2, '0'); 
  const day = originalDate.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function filterAccordionItems(filterString) {
  const accordionItems = document.querySelectorAll('.accordion-item');
  const filterLowerCase = filterString.toLowerCase();
  accordionItems.forEach((item) => {
      const ip = item.getAttribute('data-ip').toLowerCase();
      const hostname = item.getAttribute('data-hostname').toLowerCase();
      const name = item.getAttribute('data-name').toLowerCase();

      const isMatch = ip.includes(filterLowerCase) || hostname.includes(filterLowerCase) || name.includes(filterLowerCase);
      item.style.display = isMatch ? 'block' : 'none';
  });
}



function addSavedSession(name, hostname, ip, pk, color, port, created_at) {
  const subfield = hostname ? hostname : ip
  const colorfiedl = color ? `<svg width="50" height="50" viewBox="0 0 100 100"><circle cx="30" cy="50" r="25" fill="${color}"></circle></svg>`: ''

  const accordionItem = document.createElement('div');
  accordionItem.className = 'accordion-item bg-dark';
  accordionItem.id = `accordion-${pk}-item`
  accordionItem.setAttribute('data-ip', ip);
  accordionItem.setAttribute('data-hostname', hostname);
  accordionItem.setAttribute('data-name', name);

  const accordionHeader = document.createElement('h2');
  accordionHeader.className = 'accordion-header';
  accordionHeader.id = `flush${pk}-heading`;

  const accordionButton = document.createElement('button');
  accordionButton.className = 'accordion-button collapsed';
  accordionButton.style.background = `${color} !important`;
  accordionButton.type = 'button';
  accordionButton.setAttribute('data-bs-toggle', 'collapse');
  accordionButton.setAttribute('data-bs-target', `#flush-${pk}-collapse`);
  accordionButton.setAttribute('aria-expanded', 'false');
  accordionButton.setAttribute('aria-controls', `#flush-${pk}-collapse`);
  // NAme
  accordionButton.innerHTML = `${colorfiedl}
    <div class="row text-truncate w-100">
      <div class="col fw-bold">${name}:</div>
      <div class="col text-end px-4" style="font-family: consolas;">
        ${subfield}:${port}
      </div>
    </div>`;

  const accordionCollapse = document.createElement('div');
  accordionCollapse.id = `flush-${pk}-collapse`;
  accordionCollapse.className = 'accordion-collapse collapse';
  accordionCollapse.setAttribute('aria-labelledby', `flush${pk}-heading`);
  accordionCollapse.setAttribute('data-bs-parent', '#accordionFlush');

  const accordionBody = document.createElement('div');
  accordionBody.className = 'accordion-body text-center';

  // Add the content to the accordion body
  accordionBody.innerHTML = `
      <table class="table">
      <tr>
        <td>Created at: <span class="text-muted">${__formatData(created_at)}</span></td>
      </tr>
      </table>
      <div class="btn-group" role="group" aria-label="Basic mixed styles example">
          <button type="button"  onclick="removeSavedSession('${pk}')" class="btn btn-danger">Remove</button>
          <button type="button" onclick="openElementsForSaveSessions('${pk}')" class="btn btn-success">Open</button>
      </div>
      `;

  // Append elements to create the desired structure
  accordionHeader.appendChild(accordionButton);
  accordionCollapse.appendChild(accordionBody);
  accordionItem.appendChild(accordionHeader);
  accordionItem.appendChild(accordionCollapse);

  // Get the target div and append the generated accordion item
  const accordionFlush = document.getElementById('accordionFlush');
  accordionFlush.appendChild(accordionItem);
}

function closeOffCanvas(){
  const myOffcanvas = document.getElementById('offcanvasRight')
  const bsOffcanvas = bootstrap.Offcanvas.getInstance(myOffcanvas)
  bsOffcanvas.hide()
}

function addSavedSessions(saved_session_list) {
  const accordionFlush = document.getElementById('accordionFlush');
  accordionFlush.innerHTML = ''

  if (saved_session_list.length){
    saved_session_list.forEach(saved_session => {
      addSavedSession(
        saved_session.name,
        saved_session.hostname,
        saved_session.ip,
        saved_session.pk,
        saved_session.color,
        saved_session.port,
        saved_session.created_at,
      )
    })
  } else {
    accordionFlush.innerHTML = `<div class="col-12 text-center">
    <span >
      Currently you have no saved session!
    </span>
    <button class="btn btn-success m-3" onclick="addCreateTabPanels(); closeOffCanvas();" >Create new session</button></div>
    `
  }
}

function removeSavedSession(save_session_id) {
  const accordion = document.getElementById(`accordion-${save_session_id}-item`);
  if (accordion) {
    accordion.remove();
    deleteSaveSession(save_session_id)
  }
}
function prepareSavedSessions(){
  let saved_session_list = getSavedSessions();
  addSavedSessions(saved_session_list)
}
// Context menu

function __generateMenuList(session_id, button){
  let session = getSession(session_id)

  let sublist = []


   if (samples.some(([color, label]) => color === session.color)) sublist.push({
    label: '<span class="badge mx-1 p-1 w-100 text-center border-slate-600-1">Default - No color</span>',
    func: function(){
      removeTabListColor(session_id)
      updateSession(session_id, null, '-')
    },
   })

  samples.forEach((sample) => {
    let label = sample[1] 
    let color = sample[0]
    if (session.color !== color) {
      badge = `<span class="badge mx-1 p-1 w-100 text-center" style="background-color: ${color}">${label}</span>`


      sublist.push({
        label: badge,
          func: function(){
            updateTabListColor(session_id, color)
            updateSession(session_id, null, color)
          },
      })
    }
  });

  return [
    // {
    //     label: '<img class="align-top px-1" src="/static/images/share.svg" />Share',
    //     func: function(){
            
    //     },
    // },
    {
        label: '<img class="align-top px-2" src="/static/images/edit.svg /">Rename',
        func: function(){
          __createInputField(button);
        },
    },
    {
        label: '<img class="align-top px-2" src="/static/images/palette.svg" />Change color<img class="align-top" style="padding-left: 2rem" src="/static/images/nav_right.svg" />',
        
        submenu: sublist
    },
    {
        label: '<img class="align-top px-2" src="/static/images/close.svg" />Close',
        func: function(){
          deleteSession(session_id)
          removeElementsForSession(session_id)
        },
    },
    {
        label: '<img class="align-top px-2" src="/static/images/close_all.svg" />Close All',
        func: function(){
          deleteAllSessions()
          removeElementsForSessions(session_list)
        },
    }
];

}

function __generateContextMenu(menuItems) {
  const menuContainer = document.getElementById('contextMenu');
  const div = document.createElement('div');
  div.className = 'menu'

  function createMenu(menu) {
    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    menu.forEach(item => {
        const li = document.createElement('li');
        li.className = 'menu-item';

        const button = document.createElement('button');
        button.className = 'menu-button';
        button.innerHTML = item.label;
        if (item.func) button.onclick = item.func;

        li.appendChild(button);

        if (item.submenu && item.submenu.length > 0) {
            const subMenu = createMenu(item.submenu);
            subMenu.classList.add('menu-sub-list');
            li.appendChild(subMenu);
        }
        ul.appendChild(li);
    });

    return ul;
  }

  menuContainer.innerHTML = ''; // Clear existing menu
  div.appendChild(createMenu(menuItems));
  menuContainer.appendChild(div);
}
function closeAllDropDowns(){
  const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
  const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl))
  dropdownList.forEach(element => element.hide())
}
function hideMenu() {
  console.log('Hide contextmenu')
  closeAllDropDowns()
  document.getElementById("contextMenu").style.display = "none";
}

function __rightClick(e, button) {
  e.preventDefault();
  hideMenu()
  if (button && button.id == `nav-create-tab`) return;
  console.log('Open context menu')

  
  let session_id = button.id.match(/\d+/)[0];

  const contextMenuWidth = 200;
  const contextSubMenuWidth = 200;
  const menu = document.getElementById("contextMenu");
  menu.style.display = 'block';
  let leftPos = '';

  if (e.pageX < window.innerWidth - contextMenuWidth) {
      leftPos = `${e.pageX}px`;
  } else {
      leftPos = `${e.pageX - contextMenuWidth}px`;
  }

  if (e.pageX < window.innerWidth - contextMenuWidth - contextSubMenuWidth) {
      menu.classList.remove("sub-left");
  } else {
      menu.classList.add("sub-left");
  }

  menu.style.left = leftPos;
  menu.style.top = e.pageY + "px";

  document.querySelectorAll('iframe').forEach((iframe) => {
      const iframeDocument = iframe.contentDocument;
      iframeDocument.addEventListener('click', hideMenu);
  });
  let menuItems = __generateMenuList(session_id, button)
  __generateContextMenu(menuItems, 'contextMenu');

  const clickListener = function () {
    hideMenu();
    
    window.removeEventListener('click', clickListener);
  };
  window.addEventListener('click', clickListener);
}

// TAB
function __createInputField(button) {
  if (button && button.id == `nav-create-tab`) return;

  let session_id = button.id.match(/\d+/)[0];

  let input = document.createElement('input');
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
    console.error('blurr')
    __replaceInputWithButton(input, button, session_id);
  });

  input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        __replaceInputWithButton(input, button, session_id);
      }
  });
}
function __replaceInputWithButton(input, button, session_id) {

  if (input.value) {
    button.textContent = input.value;
    updateSession(session_id, input.value)
  }

  input.replaceWith(button);
}


function addTabToTabList(session_id, name, color) {

    if (document.getElementById(`nav-${session_id}-tab`)) return;

    const tablist = document.getElementById('tablist');

    const button = document.createElement('button');

    button.className = 'nav-link text-truncate my-1';
    button.id = `nav-${session_id}-tab`;
    button.setAttribute('data-bs-toggle', 'tab');
    button.setAttribute('data-bs-target', `#session-${session_id}`);
    button.type = 'button';
    button.role = 'tab';
    button.setAttribute('aria-controls', `nav-${session_id}`);
    button.setAttribute('aria-selected', 'false');
    button.textContent = name;
    button.addEventListener('dblclick', function (e) {
      __createInputField(button);
    });

    button.addEventListener('contextmenu', function (e) {
        __rightClick(e, button); // Call the rightClick function
    });

    // Append the button to the tablist
    tablist.prepend(button);

    if(color) updateTabListColor(session_id, color)
}

function removeTabFromTabList(session_id) {
    const buttonToRemove = document.getElementById(`nav-${session_id}-tab`);

    if (buttonToRemove) buttonToRemove.remove();
}
function updateTabListColor(session_id, color) {

  // if (samples.some(([colorCode, label]) => colorCode == color)) return;

  const button = document.getElementById(`nav-${session_id}-tab`);

  if (button) {
    button.style.background = `${color}`;
    console.log(`Tabcolor changed: ${color} for ${session_id}`)
  }
  
}

function removeTabListColor(session_id) {
  const button = document.getElementById(`nav-${session_id}-tab`);

  if (button) {
    button.style.background = ``;
    console.log(`Tabcolor removed for ${session_id}`)
  }
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

// PANEL
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
    iframe.className = 'bg-dark'
    iframe.allowfullscreen = true;
    iframe.addEventListener('DOMContentLoaded', function () {
      iframe.contentDocument.addEventListener('click', function () {
        console.error('test')
            hideMenu();
        });
    });

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

  if (!currnetTabPane || newTabPane) return;

  if (session_id) {
    currnetTabPane.id = `session-${session_id}`
    currnetTabPane.setAttribute('aria-labelledby', `nav-${session_id}-tab`);
  }

  console.log('new id', currnetTabPane.id)
}

// SESSIONS = TAB + PANEL
function addElementsForSession(session) {
    if (!session) return;

    addTabToTabList(session.pk, session.name, session.color);
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
function openElementsForSaveSessions(saved_sessions_id) {
  closeOffCanvas();
  let session_id = openSavedSessions(saved_sessions_id);
  let session = getSession(session_id)
  addElementsForSession(session)
  chooseElementForSession(session_id)
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

// CREATE PANEL
function addCreateTabPanels(){
    removeElementsForSessions([{pk:'create'}])

    addTabToTabList('create', '*New');
    addPanelTabToPanels('create', '/create');
    chooseElementForSession('create');
}

//  SIGANLS
window.addEventListener('message', function(event) {

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