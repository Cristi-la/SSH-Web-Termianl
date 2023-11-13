var DATA = [
    {
        id: 1,
        name: "tab1",
        type: "notepad",
        session_id: 1,
        session_enabled: true,
        session_name: 'Mama Mateusza',
        session_key: 'DJ238SD',
        session_key_hidde: true,
        lock: true,
        content: '1 - ELoel leo',
    },
    { id: 2, name:"tab2", session_id: 2, session_name: 'Tata Mateusza', type: "notepad", content: '2 - lubie',},
    { id: 3, name:"tab3", session_id: 3, session_name: 'Mama Mateusza(1)', type: "notepad", content: '3 -placki' },
    { id: 4, name:"tab4", session_id: 4, session_name: 'Mateusz', type: "notepad", content: '4 - z dupy' },
];








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





// CodeMirror(document.querySelector(`[data-window-id="2"]`), get_config())
// windowManager.windows[0].createEditor()

// async function main(){

    


//     // loadTabs(DATA);


//     // ###############
//     //  Load Windows
//     // ###############
//     // selected_id = 2

// preloadSelectedWindow(selected_id)

// loadWindows(DATA);
//     // selectTab(0)
// }

// main()



