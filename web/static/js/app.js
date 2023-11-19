var DATA = [
    {
        id: 1,
        name: "tab1",
        type: "notepad",
        session_id: 1,
        session_enabled: true,
        session_name: 'Mama Mateusza',
        session_key: 'DJ238SD1',
        session_key_hide: true,
        lock: true,
        content: '1 - ELoel leo',
    },
    { id: 2, name:"tab2", session_id: 2, session_key: 'DJ238SD2', session_name: 'Tata Mateusza', type: "notepad", content: '2 - lubie',},
    { id: 3, name:"tab3", session_id: 3, session_name: 'Mama Mateusza(1)', session_enabled: true, type: "notepad", content: '3 -placki' },
    { 
        id: 4,
        name:"tab4",
        session_id: 4,
        session_key: 'DJ238SD4',
        session_name: 'Mateusz',
        type: "notepad",
        content: '4 - z dupy',
        session_manage: false,
    },
];

// Sessions
const sharedSessionContextMenuMixin = [
    {
        label: 'Share Manage',
        action: (item, menu, lid) => {
            console.log('opne manage sharings')
        },
    },
    {
        label: 'Share Close',
        action: (item, menu, lid) => {
            let window = windowManager.getWindow(menu.tid);
            let tab = tabManager.getTab(menu.tid);

            tab.session_enabled = false
            window.session_enabled = false
            
            tabManager.selectTab(menu.tid);
            menu.reloadMenuItems()
            window.disableSessionKey()
            
        },
    },
    {
        label: 'Show/Hide session key',
        action: (item, menu, lid) => {
            tabManager.selectTab(menu.tid);
            windowManager.getWindow(menu.tid).toggleSessionKey()
        },
    },
];
const createSessionContextMenuMixin = [
    {
        label: 'Share',
        action: (item, menu, lid) => {
            let session_key = "SES7000" + menu.tid;
            let window = windowManager.getWindow(menu.tid);
            let tab = tabManager.getTab(menu.tid);

            tab.session_enabled = true
            tab.session_key = session_key
            window.session_enabled = true
            menu.reloadMenuItems()
            
            tabManager.selectTab(menu.tid);
            window.enableSessionKey(session_key)
        },
    },
];
const disbaleddSessionContextMenuMixin = [{ label: 'Share', disabled: true}];

const defaultTabContextMenu = [
    { type: 'divider' },
    {
        label: 'Close All',
        action: (item, menu, lid) => {
            tabManager.removeAllTab()
        }
    },
    {
        label: 'Close',
        action: (item, menu, lid) => {
            tabManager.removeTab(menu.tid)
        },
    }
];
// var defaultWindowContextMenu = [
//     {
//         label: 'Item 2',
//         action: () => {
//             console.log('Item 2 clicked!');
//         }
//     },
//     {
//         label: 'Item 2',
//         action: () => {
//             console.log('Item 2 clicked!');
//         }
//     },
//     {
//         label: 'Item 3',
//         action: () => {
//             console.log('Item 3 clicked!');
//         },
//         disabled: true
//     }
// ];



// ###############
//  Load CLI
// ###############
loadCli()


// ###############
//  Load Tabs
// ###############
selected_id = 2

const windowManager = new WindowManager(DATA);
const tabManager = new TabManager(DATA, windowManager);


tabManager.preloadSelectedTab(selected_id)
windowManager.preloadSelectedWindow(selected_id)

tabManager.loadTabs();
windowManager.loadWindows();



document.addEventListener('click', e=>{ContextMenu.removeOtherContextMenus(e)})
document.addEventListener('contextmenu', e=>{e.preventDefault()})
document.addEventListener('keydown', e=>{tabManager.tabSwitching(e)})



