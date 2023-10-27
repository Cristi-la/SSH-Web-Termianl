const url = `ws://${window.location.host}/ws/socket-server/`

const serverSocket = new WebSocket(url)

serverSocket.onmessage = function(e){
    let data = JSON.parse(e.data)
    console.log('Data', data)
}