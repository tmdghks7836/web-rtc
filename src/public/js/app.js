const socket = io();

const myFace = document.getElementById("myFace");
const peersFace = document.getElementById("peersFace");
const muteButton = document.getElementById("mute");
const cameraButton = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");


const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = true;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getMedia(deviceId) {

    const initialConstrains = {
        audio: true,
        video: true
    }
    const cameraConstrains = {
        audio: true,
        video: {
            deviceId: {
                exact: deviceId
            }
        }
    }

    try {

        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        )

        myFace.srcObject = myStream;
        handleMuteClick();

        if (!deviceId) {
            console.log("device id is null")
            await getCameras();
        }
    } catch (error) {
        console.log(error);

    }
}

async function getCameras() {

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        console.log(cameras)
        cameras.forEach(camera => {
            const option = document.createElement("option")
            option.value = camera.deviceId;
            option.innerText = camera.label;
            camerasSelect.appendChild(option);
        })
    } catch (error) {
        console.log(error);

    }
}

function handleMuteClick() {

    myStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
    });
    if (!muted) {
        muteButton.innerText = "Unmute";
        muted = true;
    } else {
        muteButton.innerText = "Mute";
        muted = false;
    }
}



function handleCameraClick() {
    myStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
    });
    console.log(myStream.getVideoTracks())
    if (cameraOff) {
        cameraButton.innerText = "Turn camera Off";
        cameraOff = false;
    } else {
        cameraButton.innerText = "Turn Camera On"
        cameraOff = true;
    }
}

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];

        const videoSender = myPeerConnection.getSenders().find(sender =>
            sender.track.kind === "video");
        console.log(videoSender);
        videoSender.replaceTrack(videoTrack);
    }
}
muteButton.addEventListener("click", handleMuteClick);
cameraButton.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("click", handleCameraChange);

//welcome form

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

//승환이 방생성 or 진입
async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");

    await startMedia();
    socket.emit("join_room", input.value); //방 진입
    roomName = input.value;
    input.value = ""
}


async function startMedia() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//------------------------------------------------------- socket Code

//새로들어온사람이 들어왔다고 기존사람들이 받고 offer 정보 새로들어온사람에게 넘겨줌 
socket.on("welcome", async () => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log)
    console.log("made data channel")
    console.log("someone come in")
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
})

//새로들어온사람이 offer 정보를 기존사람들에게 받고 그 사람들에게 answer 전송
socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) =>{
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", console.log)
    })
    console.log("received the offer")
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName)
})

//기존사람들이 새로들어온사람에게 연결정보 응답을 받고
socket.on("answer", async (answer) => {
    console.log("received the answer")
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", ice => {
    console.log("recieved ice candidate")
    myPeerConnection.addIceCandidate(ice);
})

//-------------------------------------------- RTC code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ]
        }]
    });
    myPeerConnection.addEventListener("icecandidate", handleIce)
    myPeerConnection.addEventListener("addstream", handleAddStream)
    console.log(myStream.getTracks())
    myStream.getTracks().forEach(track => {
        myPeerConnection.addTrack(track, myStream)
    })
}

// 내가 가지고있는 stream 장치 설정 정보를 peer to peer 연결 시 받음 
function handleIce(data) {
    socket.emit("ice", data.candidate, roomName)
    console.log("got ice candidate")
    console.log(data);
}

function handleAddStream(data) {
    console.log("get an event from my peer");
    console.log("상대 stream ", data.stream);
    console.log("my stream ", myStream);
    peersFace.srcObject = data.stream;
}