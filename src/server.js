import express from "express";
import {Server} from "socket.io"
import http from "http";
import { instrument } from "@socket.io/admin-ui"
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000")

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {

    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false,
});

function publicRooms(){
    const {
        sockets: {
            adapter: {
                sids, rooms
            },
        },
    } = wsServer;

    const publicRooms = [];
    rooms.forEach((_,key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function logMapElements(value, key, map) {
    console.log(`map.get('${key}') = ${value}`)
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


wsServer.on("connection", socket => {

    socket["nickname"] = "Anon"
    socket.onAny((event)=> {
        wsServer.sockets.adapter.sids.forEach(logMapElements)
        console.log(`Socket Event: ${event}`);
    })
    // console.log(socket);
    socket.on("enter_room", (roomName, done) => {
         socket.join(roomName);
         done();
        socket.to(roomName).emit("welcome",socket.nickname, countRoom(roomName));
        socket.emit("roomCount", countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
            socket.to(room).emit("bye", socket.nickname, countRoom(room) -1);
        });
    })

    socket.on("disconnect", () =>{
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("new_message", (msg, roomName, done) =>{

        socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`); 
        done();       
    })

    socket.on("nickname", nickname => socket["nickname"] = nickname)
})
// const wss = new WebSocket.Server({ server });



// const sockets = [];

// wss.on("connection", (socket) => {

//     sockets.push(socket);
//     socket["nickname"] = "Anon";
//     socket.on("close", () => console.log("Disconnected from the browser"));
//     socket.on("message", msg => {

//         const jsonMsg = JSON.parse(msg);
//         // console.log(parsed);

//         switch (jsonMsg.type) {
//             case "new_message":
//                 sockets.forEach(aSocket => {
//                     aSocket.send(`${socket.nickname}: ${jsonMsg.payload}`);
//                 })
//                 break;
//             case "nickname":
//                 socket["nickname"] = jsonMsg.payload;
//                 console.log(jsonMsg.payload);
//                 break;
//         }
//     })
// });

httpServer.listen(3000, handleListen);

