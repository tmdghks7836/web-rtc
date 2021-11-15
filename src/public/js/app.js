const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function serverDone(msg) {
    console.log("the back-end says : ", msg)
}


function handleRoomSubmit(event) {
    event.preventDefault();

    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, serverDone);
    input.value = "";

}

form.addEventListener("submit", handleRoomSubmit)