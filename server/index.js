import express from 'express'
import http from 'http'
import {Server} from 'socket.io'
import cors from 'cors'

const SERVER_PORT = 3001
const SERVER_HOST = 'localhost'


const app = new express()

const server = http.createServer(app)

const io = new Server(server,{
    cors: {
      origin: '*',
    }})



app.set("port",SERVER_PORT)
app.use(express.json())
app.use(express.urlencoded({ extended : true }))

app.use(cors())



app.get('/',(req,res)=>{
    return res.send('no Ar')
})


let onlineUsers = 0


io.on('connection', socket=>{
    let addedUser = false
    let myInfo = {}

    console.log(`[IO] connection => Server has a new connection`)

    socket.on('addUser',(username)=>{
        if(addedUser) return
        
        
        myInfo = username
        socket.username =username
        ++onlineUsers
        addedUser = true

        
        

        socket.emit('login',{
            onlineUsers
        })
        io.emit('chat.action',{
            type: 'join',...username,
            onlineUsers
        })
        io.emit('userJoined', {
            username: socket.username,
            onlineUsers
        })
        console.log(`[SOCKET] userJoined => user added`,username)

    })



    socket.on('chat.action',data=>{
        console.log("[SOCKET] chat.message => new message",data)
        io.emit('chat.action',data)
    })

    
    socket.on('typing',data=>{
        socket.broadcast.emit('typing',{
            username: data.username
        })
    })
    
    socket.on('stopTyping',()=>{
        socket.broadcast.emit('stopTyping',{
            username: myInfo.username
        })
    })
    
    socket.on('disconnect',()=>{
        if(addedUser)
            --onlineUsers

        console.log("[SOCKET] disconnect => socket disconnect")

        io.emit('userLeft',{
            username: socket.username,
            onlineUsers
        })
        io.emit('chat.action',{
            type: 'left',...myInfo,
            onlineUsers
        })
    })
})











server.listen(SERVER_PORT,SERVER_HOST,()=>{
    console.log(`[HTTP] listen => Server is running in https://${SERVER_HOST}:${SERVER_PORT}`)
})