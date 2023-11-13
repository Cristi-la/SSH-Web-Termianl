class TabManager {
    constructor(data, windowManager) {
        this.windowManager = windowManager
        this.DATA = data;
        this.tabs = [];
        this.tabsContainer = document.getElementById('tabs');
    }

    loadTabs() {
        this.DATA.forEach((data) => {
            if (!data.loadedTab) {
                this.addTab(data);
            }
        });
    }

    addTab(data) {
        const tabElement = new TabElement(
            data,
            this.removeTab.bind(this),
            this.changeWindow.bind(this),
            this.swapTabsIds.bind(this),
        );
        this.tabs.push(tabElement);
        this.tabsContainer.appendChild(tabElement.element);
        data.loadedTab = true;
    }

    removeTab(id) {
        const index = this.tabs.findIndex(tab => tab.id === id);
        if (index === -1) return;

        this.tabs[index].remove();
        this.tabs.splice(index, 1);
    }

    selectTab(id) {
        this.tabs.forEach(tab => {
            if (tab.id === id) tab.select();
            else tab.deselect();
        });
    }

    swapTabsIds(id1, id2) {
        const index1 = this.tabs.findIndex(tab => tab.id === id1);
        const index2 = this.tabs.findIndex(tab => tab.id === id2);

        if (index1 !== -1 && index2 !== -1) {
            this.swapTabsElements(this.tabs[index1].element, this.tabs[index2].element);
            [this.tabs[index1], this.tabs[index2]] = [this.tabs[index2], this.tabs[index1]];
        }
    }

    swapTabsElements(el1, el2) {
        if (!el1 || !el2) return;

        const temp = document.createElement('div');
        this.tabsContainer.insertBefore(temp, el1);
        this.tabsContainer.insertBefore(el1, el2);
        this.tabsContainer.insertBefore(el2, temp);
        this.tabsContainer.removeChild(temp);
    }

    changeWindow(id){
        this.selectTab(id)
        this.windowManager.showWindow(id)
    }

    preloadSelectedTab(id){
        const index = this.DATA.findIndex(tab => tab.id === id);
        const data = this.DATA[index]
        this.addTab(data)
        this.changeWindow(id)
    }
}

class TabElement {
    constructor(data, removeTabCallback, changeWindowCallback, swapTabsCallback) {
        this.id = data.id;
        this.element = this.generateTab(data);
        this.element.addEventListener('click', this.handleClick.bind(this));
        this.element.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.element.addEventListener('dragover', this.handleDragOver);
        this.element.addEventListener('drop', this.handleDrop.bind(this));
        this.closeButton = this.generateCloseTab(data.id);
        this.element.appendChild(this.closeButton);

        this.removeTabCallback = removeTabCallback
        this.changeWindowCallback = changeWindowCallback
        this.swapTabsCallback = swapTabsCallback
    }

    generateTab(data) {
        const div = document.createElement('div');
    
        div.classList = "badge rounded-pill disable_selection form-tab mx-1 px-4 border-slate-700-1";
        div.setAttribute('data-tab-id', data.id);
        div.draggable = true;
        div.textContent = data.name;
        div.value = data.name;

        return div;
    }

    generateCloseTab(id) {
        const closeButton = document.createElement('span');
        closeButton.classList.add('form-tab-close', 'border-slate-700');
        closeButton.textContent = 'X';
        closeButton.addEventListener('click', (e) => {
            this.removeTabCallback(id)
        });
        return closeButton;
    }

    remove() {
        this.element.remove();
    }

    select() {
        this.element.classList.add('active');
    }

    deselect() {
        this.element.classList.remove('active');
    }

    // Event listeners
    handleClick(e) {
        if (e.target === this.element)
        this.changeWindowCallback(this.id);
    }

    handleDragStart(e) {
        if (e.target.getAttribute('draggable') === 'true')
            e.dataTransfer.setData(
                "data-tab-id",
                e.target.getAttribute("data-tab-id")
            );
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {

        this.swapTabsCallback(
            parseInt(e.dataTransfer.getData("data-tab-id")),
            this.id
        );
    }
}


// ###############
//  Windows
// ###############
class WindowManager {
    constructor(data) {
        this.DATA = data;
        this.windows = [];
        this.windowsContainer = document.getElementById('windows');
    }
    loadWindows() {
        this.DATA.forEach((data) => {
            if (!data.loadedWindow) this.addWindow(data);
        });
    }

    addWindow(data) {
        const newWindow = new Windo(data);
        this.windows.push(newWindow);
        this.windowsContainer.appendChild(newWindow.element);

        newWindow.createEditor()
        newWindow.hide()
        data.loadedWindow = true
    }

    removeWindow(id) {
        const index = this.windows.findIndex((window) => window.id === id);
        if (index !== -1) {
            this.windows[index].remove();
            this.windows.splice(index, 1);
        }
    }
    showWindow(id) {
        this.windows.forEach(window => {
            if (window.id === id) window.show();
            else window.hide();
        });
    }
    preloadSelectedWindow(id){
        const index = this.DATA.findIndex(windo => windo.id === id);
        const data = this.DATA[index]
        this.addWindow(data)
        this.showWindow(id)
    }
}

class Windo {
    constructor(data) {
        this.type = data.type;
        this.id = data.id;
        this.content = data.content;
        this.element = this.generateWindow();
    }

    generateWindow() {
        const window = document.createElement('div');
        window.classList.add('window');
        window.setAttribute('data-window-id', this.id);
        window.setAttribute('data-window-type', this.type);
        return window;
    }

    createEditor() {
        switch (this.type) {
            case 'ssh':
                break;
            default:
                this.window = CodeMirror(this.element, this.getConfig());
        }
    }

    getConfig() {
        const DEFAULT_CONFIG = {
            value: this.content,
            mode: 'javascript',
            lineNumbers: true,
            theme: 'base16-dark',
            smartIndent: true,
            electricChars: true,
            lineWrapping: true,
            indentUnit: 4,
        };
        return DEFAULT_CONFIG;
    }

    hide() {
        this.element.firstElementChild.classList.add('hide');
    }

    show() {
        this.element.firstElementChild.classList.remove('hide');
        this.window.setSize('100%', document.querySelector('#windows').clientHeight + 'px');
    }

    remove() {
        this.element.remove();
    }
}
