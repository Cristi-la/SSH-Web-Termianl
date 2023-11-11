// ###############
//  Tabulators
// ###############

async function loadTabs(data) {
    data.forEach((tab, id) =>  {
        if (tab.loadedTab) return;

        addTab(tab, id);
        getDataById(id).loadedTab = true
    });
}

function generateCloseTab(id){
    const cls = document.createElement('span');
    cls.classList.add('form-tab-close');
    cls.classList.add('border-slate-700');
    cls.textContent = 'X';

    cls.addEventListener('click', (e) => {
        removeTab(id)
    });
    return cls
}

function deselectAllTabs(){
    const divs = document.querySelectorAll(`.form-tab`);

    divs.forEach((div) => {
        div.classList.remove('active')
    });
}

function selectTabs(id){
    const divs = document.querySelectorAll(`[data-tab-id="${id}"]`); 
    divs.forEach((div) => {
       if (!div.classList.contains('active')) div.classList.add('active');
    });
}

function generateTab(tab, id){
    const div = document.createElement('div');
    const cls = generateCloseTab(id);
    
    div.classList = "badge rounded-pill disable_selection form-tab mx-1 px-4 border-slate-700-1";
    div.setAttribute('data-tab-id', id);
    div.textContent = tab.name;
    div.appendChild(cls);
    div.addEventListener('click', (e) => {
        if (e.target !== div) return;
        changeWindow(id)

    });

    return div
}


function addTab(tab, id) {
    const tabsdiv = document.getElementById('tabs');
    const div = generateTab(tab, id);
    tabsdiv.appendChild(div);
}

function removeTab(id) {
    const divs = document.querySelectorAll(`[data-tab-id="${id}"]`);

    divs.forEach((div) => {
        div.remove();
    });
}


// ###############
//  Windows
// ###############
DEFAULT_CONFIG = {
    // value: "function myScript() {\n  return 100;\n}",
    mode: "javascript",
    lineNumbers: true,
    theme: 'base16-dark',
    smartIndent: true,
    electricChars: true,
    lineWrapping: true,
    indentUnit: 4,
    // fullScreen: true,
}

function get_config(extra={}){
    return Object.assign(extra, DEFAULT_CONFIG)
}

async function loadWindows(data){
    data.forEach((window, id) =>  {
        if (window.loadedWindow) return;

        addWindow(window, id)
        getDataById(id).loadedWindow = true
    });
}


function generateWindow(type, id){
    const div = document.createElement('div');
    div.classList.add("window");
    div.setAttribute('data-window-id', id);
    div.setAttribute('data-window-type', type);
    return div
}

function createWindowType(div, type, show=false, id, content){
    switch (type) {
        case '':
            

            break;
    
        default:
            getDataById(id).window = CodeMirror(
                div, get_config({'value':content})
            )
            if (!show) div.firstElementChild.classList.add("hide")
    }
}
function hideWindowType(div, type, id){
    switch (type) {
        case '':
            break;
    
        default:
            if (!div.firstElementChild.classList.contains("hide")) 
                div.firstElementChild.classList.add("hide");
    }
}
function showWindowType(div, type, id){
    switch (type) {
        case '':
            break;
    
        default:
            getDataById(id).window.setSize("100%", document.querySelector('#windows').clientHeight + 'px');
            div.firstElementChild.classList.remove("hide");
    }
}

function addWindow(window, id, show=false) {
    const windowsdiv = document.getElementById('windows');
    const div = generateWindow(window.type, id);
    windowsdiv.appendChild(div);

    createWindowType(div, window.type, show, id, window.content)

}

function removeWindow(id) {
    const divs = document.querySelectorAll(`[data-window-id="${id}"]`);

    divs.forEach((div) => {
        div.remove();
    });
}



function hideWindows(){
    const divs = document.querySelectorAll(`div.window`);
    
    divs.forEach((div) => {
        hideWindowType(div, div.getAttribute('data-window-type'))
    });
}

function showWindows(id){
    const divs = document.querySelectorAll(`[data-window-id="${id}"]`);
    
    divs.forEach((div) => {
        showWindowType(div, div.getAttribute('data-window-type'), id)
    });
}

function preloadSelectedWindow(id){
    addWindow(getDataById(id), id, true)

    getDataById(id).loadedTab = true
    getDataById(id).loadedWindow = true

    changeWindow(id)
}


function changeWindow(id){
    deselectAllTabs()
    selectTabs(id)
    hideWindows()
    showWindows(id)
}


// Utils
function getDataById(id){
    return data[id]
}