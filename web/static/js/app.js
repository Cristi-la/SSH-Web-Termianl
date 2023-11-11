var data = [
    { 
        name: "tab1",
        type: "notepad",
        session_id: 1,
        session_enabled: true,
        session_name: 'Mama Mateusza',
        session_key: 'DJ238SD',
        session_key_hidde: true,
        lock: true,
        content: 'ELoel leo',
    },
    { name:"tab2", session_id: 2, session_name: 'Tata Mateusza', type: "notepad", content: 'lubie',},
    { name:"tab3", session_id: 3, session_name: 'Mama Mateusza(1)', type: "notepad", content: 'placki' },
    { name:"tab4", session_id: 4, session_name: 'Mateusz', type: "notepad", content: 'z dupy' },
];









// Other
// selectTab(1);

async function main(){
    // ###############
    //  Load CLI
    // ###############
    loadCli()

    // ###############
    //  Load Tabs
    // ###############
    loadTabs(data);

    // ###############
    //  Load Windows
    // ###############
    selected_id = 2

    preloadSelectedWindow(selected_id)

    await loadWindows(data);

    // selectTab(0)
}

main()



