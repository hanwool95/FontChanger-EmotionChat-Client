import './App.css';
import React, {useState, useEffect, useRef} from 'react';
import TextField from '@material-ui/core/TextField';
import io from 'socket.io-client'

const socket = io.connect('ws://127.0.0.1:3737');

let api_keys = "api_key="+process.env.REACT_APP_KEY+"&api_secret="+process.env.REACT_APP_SECRETE

let run_video_camera = () => {
    let video = document.querySelector("#video");
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
            })
            .catch(function (err0r) {
                console.log("Something went wrong!");
            });
    }
    return video
}

let caputure_video = (video) => {
    let canvas = document.querySelector("#canvas");
    canvas.getContext('2d').drawImage(video, 0, 0, 200, 150);
   	let image_data_url = canvas.toDataURL('image/jpeg');
    return image_data_url
}

function App() {

    // useState를 활용하면 class 없이 상태와 set 선언 가능.
    const [state, setState] = useState({message:'', name:''})
    const [chat,setChat] = useState([])

    // let stream = navigator.mediaDevices.getUserMedia({ video: true, audio: false});
    // let video = document.querySelector("#video");
    // video.srcObject = stream;



    useEffect(() =>{
        socket.on('clientReceiver', ({name, message, emotion})=>{
            setChat([...chat,{name, message, emotion}])
            return () => socket.disconnect()
        })
    }, [ chat ])
//
    // 텍스트 변환시 상태 변환.
    const onTextChange = e =>{
        setState({...state, [e.target.name]: e.target.value})
    }
    const onMessageSubmit =(e)=>{
        e.preventDefault()
        let {name, message} = state
        let emotion
        let video = run_video_camera()
        let base64img = caputure_video(video)
        console.log(base64img)
        let splited_base64 = base64img.split(",")
        console.log(splited_base64[1])

        fetch("/image_api/facepp/v3/detect", {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          method: "POST",
            body: api_keys+"&image_base64=" + splited_base64[1] +
                "&return_attributes=emotion"
        }).then((response) => response.json()).then((data) =>{
            console.log(data)
            emotion=JSON.stringify(data.faces[0].attributes.emotion)}).then(() => socket.emit('serverReceiver', {name, message, emotion}))

        //초기화
        setState({message : '', name})
    }

    const renderChat = () =>{
        return chat.map(({name, message, emotion}, index)=>(
            <div key={index}>
                <h3>{name}:<span>{message}</span></h3>
                <h5>{emotion}</h5>
            </div>
        ))
    }

    return (
        <div className='card'>
            <form onSubmit={onMessageSubmit}>
                <h1>Message</h1>
                <div className="name-field">
                    <TextField
                        name ="name"
                        onChange={e=> onTextChange(e)}
                        value={state.name}
                        label="Name"/>
                </div>
                <div >
                    <TextField
                        name ="message"
                        onChange={e=> onTextChange(e)}
                        value={state.message}
                        id="outlined-multiline-static"
                        variant="outlined"
                        label="Message"/>
                </div>
                <button>Send Message</button>
            </form>
            <div className="render-chat">
                <h1>Chat log</h1>
                {renderChat()}
            </div>
        <div>
            <video
                    id ="video"
                    width = "200"
                    hegith = "150"
                    autoPlay
                ></video>
            <div>
            <canvas
                id="canvas"
                width = "200"
                hegith = "150"
                ></canvas>
            </div>
        </div>
        </div>
    );
}



export default App;
