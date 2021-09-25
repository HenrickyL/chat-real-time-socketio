// import styles from './styles.module.css';
import { useEffect, useState } from 'react';
import './styles.css'
import io from 'socket.io-client'
import {v4 as uuid} from 'uuid'
import {format,parseISO,isAfter} from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import classnames from 'classnames'


const myId = uuid()

const socket = io('http://localhost:3001')
socket.on('connect',()=>{
    console.log('[IO] connect => A new connection has bean establiched')
})

const Login = (props)=>{
    const {setUsername,setLogged} = props
    const [_username,_setUsername] = useState('')

    const handleSubmit = (e)=>{
        e.preventDefault()
        if(_username.trim()){
            _setUsername('')
            socket.emit('addUser',{
                id: myId,
                username:_username,
                joinTime: new Date(),
            })
            setUsername(_username)
            setLogged(true)
        }
        
    }
    const handleChange= (e)=>{
        let {value} = e.target
        if(value.length <= 12)
        _setUsername(value)
    }
    return(
        <form onSubmit={handleSubmit} className="login">
    
            <label htmlFor="username">UserName</label>
            <input id='username' 
                type="text" 
                value={_username}  
                autoFocus
                onChange={handleChange}
                />
        </form>
    )
}



const Chat =()=>{
    const [username,setUsername] = useState('')
    const [logged,setLogged] =useState(false);
    const [message,setMessage] =useState('');
    const [actions,setActions] =useState([]);
    const [onlineUsers,setOnlineUsers] =useState(0);
    
    const [typing,setTyping] =useState(false);//my
    const [typingTimeOut,setTypingTimeOut] =useState(null);
    const [userTyping,setUserTyping] =useState({username:'alguém'});//other


    useEffect(()=>{
        socket.on('typing',
        data=>{
            
            setTyping(true)
            setUserTyping(data)
        }
        )
        socket.on('stopTyping',
        data=>{
            setTyping(false)

            setUserTyping({})
        })

        return ()=> {
            socket.off('typing')
            socket.off('stopTyping')

        }

    },[])

  

    
    useEffect(()=>{
        const handleNewAction= newAction=>{
            setActions([newAction,...actions,])
            if(newAction.onlineUsers)
                setOnlineUsers(newAction.onlineUsers)
        }
        
        

        socket.on('chat.action',handleNewAction)

        return ()=> socket.off('chat.action',handleNewAction)
    },[actions])



    const handleInputChange = (e)=>{
        setMessage(e.target.value)
        
        
        socket.emit('typing',{username})

        clearTimeout(typingTimeOut)
        setTypingTimeOut(
            setTimeout(()=>{
                socket.emit('stopTyping',{username})
            }, 800)
        )
       
    }
    const handleFormSubmit = (e)=>{
        e.preventDefault()
        
        socket.emit('stopTyping')
        clearTimeout(typingTimeOut)

        

        if(message.trim()){
            
            socket.emit('chat.action',{
                id:myId,
                type:'message',
                username:username,
                sendTime: new Date(),
                message:message})

            setMessage('')
        }
    }

    return (
        <>
        {!logged && <Login setLogged={setLogged} setUsername={setUsername} /> }
        <div className="container">
            <div className="info">
                <span>Username: {username}</span>
                <span className='info_qtd'>{onlineUsers} usuários online</span>
            </div>
            
            <ul className="list">
                {
                    actions.slice(0,50).map((m,i)=>(
                       
                        m.type === 'message'?
                        (<l1 key={`m_${i}`} className={`list__item list__item--${m.id===myId ? 'mine' : 'other'}`}>
                            <div className={`message message--${m.id===myId ? 'mine' : 'other'}`}>
                            <span className="username">{m.username}</span>
                            <span className="text">
                                {m.message}
                            </span>
                            <span className="time">{format(parseISO(m.sendTime),"HH:mm",{locale: ptBR}) }</span>
                            </div>
                            
                        </l1>): m.type === 'join'?
                            (<span key={`j_${i}`} className="join">Usuário {m.username} entrou</span>):
                            (<span key={`l_${i}`} className="left">Usuário {m.username} saiu</span>)

                       
                    ))
                }
            
            </ul>
            {
                typing ? (
                    <div className="typing fadeIn">
                    
                        <span> <b>{userTyping.username}</b> está digitando...</span>
                        
                    </div>
                ): (<div className="typing" style={{opacity:'0'}}>
                    
                        <span> <b>{userTyping.username}</b> está digitando...</span>
                
                    </div>
            )
            }
            <form onSubmit={handleFormSubmit} className="form">
                <input 
                    className='form__field'
                    placeholder='Digite uma mensagem...'
                    type="text" 
                    value={message}
                    onChange={handleInputChange}
                />
                
            </form>
        </div>
    </>
    )
}

export default Chat;