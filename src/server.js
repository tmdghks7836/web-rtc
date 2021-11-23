import express from "express";
import {
    Server
} from "socket.io"
import http from "http";
import {
    instrument
} from "@socket.io/admin-ui"
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000")

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", socket => {
    socket.on("join_room", (roomName, done) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome") // 다른 방 사람들에게 방에 들어왔다고 알림
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer); //다른사람들에게 connection 정보 알려줌
    })
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer); //다른사람들에게 연결 응답을 보냄
    })
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice); //다른사람들에게 연결 응답을 보냄
    })
})

instrument(wsServer, {
    auth: false,
});

httpServer.listen(3000, handleListen);
