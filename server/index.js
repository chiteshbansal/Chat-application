const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");
const path = require('path')

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const PORT = process.env.PORT || 5000;

// const router = require("./router");
app.use(bodyParser.json());
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// app.use(router);

if (process.env.NODE_ENV === 'production') {

  app.use(express.static(path.join(__dirname, '/../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'build', 'index.html'));

  })
}

io.on("connection", (socket) => {
  console.log("new mf in town");

  socket.on("join", ({ name, room }, callback) => {
    console.log(name, room);
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);


    socket.emit("message", {
      user: "admin",
      text: `Hey ${user.name}!! Welcome to ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", {
        user: "admin",
        text: `${user.name} just joined the room`,
      });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user, room) })


    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', { user: 'admin', text: `${user.name} just left!` })
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    }
  });
});

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
