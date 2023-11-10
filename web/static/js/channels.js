const url = `ws://${window.location.host}/ws/socket-server/`
const secondUrl = `ws://${window.location.host}/ws/ssh-socket/`


const serverSocket = new WebSocket(url)
const sshServerSocket = new WebSocket(secondUrl)

serverSocket.onmessage = function(e){
    let data = JSON.parse(e.data)
}

sshServerSocket.onmessage = function(e){
    let data = JSON.parse(e.data)
    processSSHResponse(data)
}