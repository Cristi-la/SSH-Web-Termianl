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

var defaultTabContextMenu = [
    {
        label: 'Share',
        action: () => {
            console.log('Item 2 clicked!');
        }
    },
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

// var offsetxpoint=-60 //Customize x offset of tooltip
// var offsetypoint=20 //Customize y offset of tooltip
// var ie=document.all
// var ns6=document.getElementById && !document.all
// var enabletip=false
// if (ie||ns6)
// var tipobj=document.all? document.all["dhtmltooltip"] : document.getElementById? document.getElementById("windows") : ""

// function ietruebody(){
// return (document.compatMode && document.compatMode!="BackCompat")? document.documentElement : document.body
// }

// function ddrivetip(thetext, thecolor, thewidth){
// if (ns6||ie){
// if (typeof thewidth!="undefined") tipobj.style.width=thewidth+"px"
// if (typeof thecolor!="undefined" && thecolor!="") tipobj.style.backgroundColor=thecolor
// tipobj.innerHTML=thetext
// enabletip=true
// return false
// }
// }

// function positiontip(e){
// if (enabletip){
// var curX=(ns6)?e.pageX : event.clientX+ietruebody().scrollLeft;
// var curY=(ns6)?e.pageY : event.clientY+ietruebody().scrollTop;
// //Find out how close the mouse is to the corner of the window
// var rightedge=ie&&!window.opera? ietruebody().clientWidth-event.clientX-offsetxpoint : window.innerWidth-e.clientX-offsetxpoint-20
// var bottomedge=ie&&!window.opera? ietruebody().clientHeight-event.clientY-offsetypoint : window.innerHeight-e.clientY-offsetypoint-20

// var leftedge=(offsetxpoint<0)? offsetxpoint*(-1) : -1000

// //if the horizontal distance isn't enough to accomodate the width of the context menu
// if (rightedge<tipobj.offsetWidth)
// //move the horizontal position of the menu to the left by it's width
// tipobj.style.left=ie? ietruebody().scrollLeft+event.clientX-tipobj.offsetWidth+"px" : window.pageXOffset+e.clientX-tipobj.offsetWidth+"px"
// else if (curX<leftedge)
// tipobj.style.left="5px"
// else
// //position the horizontal position of the menu where the mouse is positioned
// tipobj.style.left=curX+offsetxpoint+"px"

// //same concept with the vertical position
// if (bottomedge<tipobj.offsetHeight)
// tipobj.style.top=ie? ietruebody().scrollTop+event.clientY-tipobj.offsetHeight-offsetypoint+"px" : window.pageYOffset+e.clientY-tipobj.offsetHeight-offsetypoint+"px"
// else
// tipobj.style.top=curY+offsetypoint+"px"
// tipobj.style.visibility="visible"
// }
// }

// function hideddrivetip(){
// if (ns6||ie){
// enabletip=false
// tipobj.style.visibility="hidden"
// tipobj.style.left="-1000px"
// tipobj.style.backgroundColor=''
// tipobj.style.width=''
// }
// }

// document.onmousemove=positiontip
// console.log('ddd')


