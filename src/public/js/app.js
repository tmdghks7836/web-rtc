const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message){
    const ul = chat.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const inputValue = input.value;
    socket.emit("new_message", inputValue, roomName, () =>{
        addMessage(`You: ${inputValue}`);
    });
    input.value = ""
}

function handleNickNameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);

}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");

    nameForm.addEventListener("submit", handleNickNameSubmit)
    msgForm.addEventListener("submit", handleMessageSubmit)
}

function setRoomTitle(roomName, newCount){
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
}

function handleRoomSubmit(event) {
    event.preventDefault();

    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value = "";

}

form.addEventListener("submit", handleRoomSubmit)

socket.on("welcome", (user, newCount) => {
    setRoomTitle(roomName,newCount);
    addMessage(`${user} joined`); 
})

socket.on("bye", (user, newCount) => {
    setRoomTitle(roomName,newCount);
    addMessage(`${user} left ㅜㅜ`)
})

socket.on("new_message", (msg) => {
    addMessage(msg)
})

socket.on("roomCount", (roomCount) => {
    setRoomTitle(roomName,roomCount);
})

socket.on("room_change", (rooms) => {

const roomList = welcome.querySelector("ul");
roomList.innerHTML = "";
 rooms.forEach(room => {
     const li = document.createElement("li");
     li.innerText = room;
     roomList.append(li);
 });
 
});