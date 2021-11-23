const socket = io();

const myFace = document.getElementById("myFace");
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

function handleCameraChange() {
    getMedia(camerasSelect.value)
}
muteButton.addEventListener("click", handleMuteClick);
cameraButton.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

//welcome form

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

function handleWelcomeSubmit() {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    socket.emit("join_room", input.value, startMedia);
    roomName = input.value;
    input.value = ""
}

async function startMedia(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket Code

socket.on("welcome", async () => {
    console.log("someone come in")
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
})

socket.on("offer", offer => {
    console.log(offer);
})


// RTC code

function makeConnection(){
    myPeerConnection = new RTCPeerConnection();
    console.log(myStream.getTracks())
    myStream.getTracks().forEach(track => {
        myPeerConnection.addTrack(track, myStream)
    })
}