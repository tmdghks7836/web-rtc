import express from "express";
import WebSocket from "ws";
import http from "http";
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000")

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {

    sockets.push(socket);
    socket["nickname"] = "Anon";
    socket.on("close", () => console.log("Disconnected from the browser"));
    socket.on("message", msg => {
       
        const jsonMsg = JSON.parse(msg);
        // console.log(parsed);
        
        switch (jsonMsg.type) {
            case "new_message":
                sockets.forEach(aSocket => {
                    aSocket.send(`${socket.nickname}: ${jsonMsg.payload}`);
                })
                break;
            case "nickname":
                socket["nickname"] = jsonMsg.payload;
                console.log(jsonMsg.payload);
                break;
        }
    })
});

server.listen(3000, handleListen);

