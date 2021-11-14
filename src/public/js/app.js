const socket = new WebSocket(`ws://${window.location.host}`);
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nick");


socket.addEventListener("open", () => {
    console.log("Connected to Server ");
})

socket.addEventListener("message", (message) => {
    console.log("new Message: ", message.data)
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
})

socket.addEventListener("close", () => {
    console.log("close from server");
})

setTimeout(() => {
    socket.send("hello from the browser!")
}, 10000)

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value));
    const li = document.createElement("li");
    li.innerText = `YOU: ${input.value}`;
    messageList.append(li);
    input.value = "";
}

function handleNickSubmit(event) {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
}

messageForm.addEventListener("submit", handleMessageSubmit)

nickForm.addEventListener("submit", handleNickSubmit)


function makeMessage(type, payload) {
    const msg = { type, payload }
    return JSON.stringify(msg);
}