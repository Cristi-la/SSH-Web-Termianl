class TabManager {
    constructor(data, windowManager) {
        this.windowManager = windowManager
        this.data = data;
        this.tabs = [];
        this.tabsContainer = document.getElementById('tabs');
    }

    loadTabs() {
        this.data.forEach((data) => {
            if (!data.loadedTab) this.addTab(data);
        });
    }

    addTab(data) {
        const tabElement = new TabElement(
            data,
            this.removeTab.bind(this),
            this.selectTab.bind(this),
            this.swapTabsIds.bind(this),
        );
        this.tabs.push(tabElement);
        this.tabsContainer.appendChild(tabElement.element);
        data.loadedTab = true;
    }

    getNearestTabId() {
        const activeTabs = this.tabsContainer.querySelectorAll('.form-tab.active');
        if (!activeTabs || activeTabs.length > 1) return null; 

        const previousId =  this.getPreviousTabId(activeTabs[0]);
        if (previousId) return previousId;

        const nextId = this.getNextTabId(activeTabs[0]);
        if (nextId) return nextId;

        return this.getFirstTabId();
    }
    getNextTabId(activeTab){
        const nextTab = activeTab.nextElementSibling
        if (nextTab) return parseInt(nextTab.getAttribute('data-tab-id'));
    }
    getPreviousTabId(activeTab){
        const previousTab = activeTab.previousElementSibling
        if (previousTab) return parseInt(previousTab.getAttribute('data-tab-id'));
    }
    getFirstTabId(){
        const firstTabElement = this.tabsContainer.firstElementChild;

        if (!firstTabElement) return null; 
    
        const tabId = firstTabElement.getAttribute('data-tab-id');
    
        if (!tabId) return null;
    
        return parseInt(tabId);
    }
    getLastTabId() {
        const lastTabElement = this.tabsContainer.lastElementChild;
    
        if (!lastTabElement) return null;
    
        const tabId = lastTabElement.getAttribute('data-tab-id');
    
        if (!tabId) return null;
    
        return parseInt(tabId);
    }

    getCycleNextTabId(){
        const activeTabs = this.tabsContainer.querySelectorAll('.form-tab.active');
        if (!activeTabs || activeTabs.length > 1) return; 

        const nextTabId = this.getNextTabId(activeTabs[0])
        if (nextTabId) return nextTabId;

        const firstTabId = this.getFirstTabId()
        if (firstTabId) return firstTabId;
    }

    getCyclePreviousTabId(){
        const activeTabs = this.tabsContainer.querySelectorAll('.form-tab.active');
        if (!activeTabs || activeTabs.length > 1) return; 

        const previousId =  this.getPreviousTabId(activeTabs[0]);
        if (previousId) return previousId;

        const lastTabId = this.getLastTabId()
        if (lastTabId) return lastTabId;
    }

    removeTab(id) {
        if (!id) return;

        const index = this.tabs.findIndex(tab => tab.id === id);
        if (index === -1) return;

        let wasActive = this.tabs[index].element.classList.contains('active')
        if (wasActive) this.selectTab(this.getNearestTabId())

        this.tabs[index].remove();
        this.tabs.splice(index, 1);
        this.windowManager.removeWindow(id)


    }
    removeAllTab(){
        this.tabs.forEach(tab => {
            tab.remove();
            this.windowManager.removeWindow(tab.id)
        });
        this.tabs = []
    }

    selectTab(id) {
        if (!id) return;

        this.tabs.forEach(tab => {
            if (tab.id === id) {
                tab.select();
                this.windowManager.showWindow(id)
            } else tab.deselect();
        });
    }

    swapTabsIds(id1, id2) {
        if (!id1 || !id2) return;

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

    preloadSelectedTab(id){
        if (!id) return;

        const index = this.data.findIndex(tab => tab.id === id);
        const data = this.data[index]
        this.addTab(data)
        this.selectTab(id)
    }

    tabSwitching(event){
        if (document.activeElement.tagName.toLowerCase() === 'textarea') {
            return;
        }
        if (event.key === 'Tab') {  
            event.preventDefault(); 
            if (event.shiftKey) {
                this.selectTab(this.getCyclePreviousTabId());
            } else {
                this.selectTab(this.getCycleNextTabId());
            }
        }
    }

    getIndex(id){
        return this.tabs.findIndex((tab) => tab.id === id);
    }
    getTab(id){
        const index = this.getIndex(id);
        if (index === -1) return null

        return this.tabs[index]
    }
}

class TabElement {
    constructor(data, removeTabCallback, selectTabCallback, swapTabsCallback) {
        this.id = data.id;
        this.session_key = data.session_key;
        this.session_manage = data.session_manage;
        this.session_enabled = data.session_enabled;
        this.element = this.generateTab(data);
        this.element.addEventListener('click', this.handleClick.bind(this));

        this.element.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.element.addEventListener('dragend', this.handleDragEnd.bind(this));

        this.element.addEventListener('dragover', this.handleDragOver.bind(this));
        this.element.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.element.addEventListener('drop', this.handleDrop.bind(this));
        this.closeButton = this.generateCloseTab(data.id);
        this.element.appendChild(this.closeButton);

        this.removeTabCallback = removeTabCallback
        this.selectTabCallback = selectTabCallback
        this.swapTabsCallback = swapTabsCallback

        this.contextMenu = new ContextMenu(
            this.generateContextMenu(), 
            this.id,
            this.generateContextMenu.bind(this)
        );
        this.contextMenu.attachContextMenuListener(this.element);
    }

    generateContextMenu(){
        let menuitems = []

        if (this.session_manage === false) {
            menuitems.push(...disbaleddSessionContextMenuMixin)
        } else {
            if (this.session_enabled && this.session_key) {
                menuitems.push(...sharedSessionContextMenuMixin)
            }
            else menuitems.push(...createSessionContextMenuMixin)
        }

        menuitems.push(...defaultTabContextMenu)


        return menuitems
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
        this.selectTabCallback(this.id);
    }
    handleDragEnd(e){
        // Drop Target handler
        this.element.classList.remove('drag')
        this.element.classList.add('blink')
        e.preventDefault();
    }

    handleDragStart(e) {
        // Drop Target handler
        this.element.classList.add('drag')

        if (e.target.getAttribute('draggable') === 'true')
            e.dataTransfer.setData(
                "data-tab-id",
                e.target.getAttribute("data-tab-id")
            );
    }

    handleDragOver(e) {
        // Draggable Element handler
        this.element.classList.add('dragover')
        e.preventDefault();
    }
    handleDragLeave(e) {
        // Draggable Element handler
        this.element.classList.remove('dragover')
        e.preventDefault();
    }

    handleDrop(e) {
        // Draggable Element handler
        this.element.classList.remove('dragover')
        this.element.classList.add('blink')

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
        this.data = data;
        this.windows = [];
        this.windowsContainer = document.getElementById('windows');
    }
    loadWindows() {
        this.data.forEach((data) => {
            if (!data.loadedWindow) this.addWindow(data);
        });
    }

    addWindow(data) {
        const newWindow = new Windo(data);
        this.windows.push(newWindow);
        this.windowsContainer.appendChild(newWindow.element);

        newWindow.createEditor()
        newWindow.createSessionKey()
        newWindow.hide()
        data.loadedWindow = true
    }

    removeWindow(id) {
        const index = this.getIndex(id);
        if (index === -1) return;

        this.windows[index].remove();
        this.windows.splice(index, 1);
    }
    showWindow(id) {
        this.windows.forEach(window => {
            if (window.id === id) window.show();
            else window.hide();
        });
    }
    preloadSelectedWindow(id){
        const index = this.data.findIndex((window) => window.id === id);

        const data = this.data[index]
        this.addWindow(data)
        this.showWindow(id)
    }
    getIndex(id){
        return this.windows.findIndex((window) => window.id === id);
    }
    getWindow(id){
        const index = this.getIndex(id);
        if (index === -1) return null

        return this.windows[index]
    }
}

class Windo {
    constructor(data) {
        this.type = data.type;
        this.id = data.id;
        this.session_key_hide = data.session_key_hide
        this.session_manage = data.session_manage
        this.session_enabled = data.session_enabled
        this.content = data.content;
        this.content = data.content;
        this.session_key = data.session_key;
        this.elementKey = this.generateSessionKeyElement();
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

    generateSessionKeyElement(){
        if (this.elementKey) this.elementKey.remove()

        const div = document.createElement('div');
        div.classList.add('sessionKey');
        div.classList.add('hide');
        div.setAttribute('data-key-id', this.id);
        div.textContent = '######';

        div.addEventListener('click', this.copySessionKey.bind(this));
        div.addEventListener('dblclick', this.toggleSessionKey.bind(this));

        return div
    }

    createSessionKey(){
        this.element.appendChild(this.elementKey);

        if (!this.session_key) return;

        this.enableSessionKey()
    }

    enableSessionKey(key){
        if (this.session_manage === false || !this.session_enabled == true || !this.session_key) return;

        if (key) this.session_key = key;
        this.elementKey.textContent = this.session_key

        this.elementKey.classList.remove('hide');

        if (this.session_key_hide) this.toggleSessionKey()

    }
    disableSessionKey(){
        this.session_key = '########';
        this.elementKey.textContent = this.session_key
        this.elementKey.classList.add('hide');
    }
    
    toggleSessionKey(){
        if (this.elementKey.classList.contains('hide')) return;

        this.elementKey.classList.toggle('hideKey');
        if (this.elementKey.classList.contains('hideKey'))
            this.elementKey.textContent = '########'
        else this.elementKey.textContent = this.session_key
    }

    copySessionKey(){
        if (this.elementKey.classList.contains('hideKey')) return;
        this.elementKey.classList.add('jello-horizontal');
        
        setTimeout(()=>{
            this.elementKey.classList.remove('jello-horizontal');
        }, 900);

        let textarea = document.createElement('textarea');
        textarea.value = this.session_key;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}


// ###############
//  Context Menu
// ###############
class ContextMenu {
    constructor(menuItems, tid, bindMenuItemGetter) {
        this.tid = tid // Tabulator/Window ID
        this.padding = 15
        this.menuItems = menuItems;
        this.bindMenuItemGetter = bindMenuItemGetter
    }
    generatDivider(item){
        const divider = document.createElement('div');
        divider.classList.add('divider')
        return divider
    }
    generatActionItem(item, id){
        const menuItem = document.createElement('li');
        if ('disabled' in item && item.disabled) menuItem.classList.add('disabled')
        menuItem.textContent = item.label;
        menuItem.addEventListener('click', (e) => {
            e.preventDefault()
            if (menuItem.classList.contains('disabled')) return;
            
            item.action(item, this, id)
            this.removeContextMenu();
        });

        return menuItem
    }

    generatMenuItem(item, id){
        switch (item.type) {
            case 'divider':
                return this.generatDivider(item)
            default:
                return this.generatActionItem(item, id)
        }
    }

    generateContextMenu() {
        const contextMenu = document.createElement('ul');
        contextMenu.classList.add('context-menu');
        contextMenu.classList.add('disable_selection');
        contextMenu.setAttribute('role', 'menu');
        contextMenu.setAttribute('aria-labelledby', 'dropdownMenu');

        if (!this.menuItems.length) {
            contextMenu.appendChild(
                this.generatMenuItem({ label: '-- No items --', disabled: true}, 0)

            );
        } else {
            this.menuItems.forEach((item, id) => {
                contextMenu.appendChild(
                    this.generatMenuItem(item, id)
                );
            });
        }

        document.body.appendChild(contextMenu);
        return contextMenu;
    }

    openContextMenu(event){
        ContextMenu.removeOtherContextMenus()
        this.element = this.generateContextMenu();
        const [x, y] = this.setLocation(event)
        this.element.style['top'] = y + 'px';
        this.element.style['left'] = x + 'px';
    }

    setLocation(event) {
        let x = event.pageX;
        let y = event.pageY;

        if (event.pageX + this.element.offsetWidth + this.padding > window.innerWidth + window.scrollX) {
            x = window.innerWidth + window.scrollX - this.element.offsetWidth - this.padding;
        } else if (event.pageX - this.padding < window.scrollX) {
            x = window.scrollX + this.padding;
        } else {
            x = Math.max(x, window.scrollX + this.padding);
        }
    
        if (event.pageY + this.element.offsetHeight + this.padding > window.innerHeight + window.scrollY) {
            y = window.innerHeight + window.scrollY - this.element.offsetHeight - this.padding;
        } else if (event.pageY - this.padding < window.scrollY) {
            y = window.scrollY + this.padding;
        } else {
            y = Math.max(y, window.scrollY + this.padding);
        }
    
        return [x, y]
    }

    removeContextMenu() {
        this.element.remove()
    }
    
    static removeOtherContextMenus(e) {
        const existingMenus = document.querySelectorAll('.context-menu');

        if (e && e.target.classList.contains('disabled')) return;

        existingMenus.forEach(menu => {
            menu.remove();
        });
    }

    attachContextMenuListener(element) {
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.openContextMenu(e);
        });
    }
    reloadMenuItems(){
        if(!this.bindMenuItemGetter) return;
        this.menuItems = this.bindMenuItemGetter()
    }
}

