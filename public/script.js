const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video')
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

let myPeer = null;

async function getIceServers() {
    const res = await fetch("/api/turn");
    const data = await res.json();
    return [{ urls: data.urls, username: data.username, credential: data.credential }];
}

async function initPeer() {
    const iceServers = await getIceServers();

    return new Promise((resolve) => {
        const peer = new Peer({
            host: PEER_HOST,
            port: '30001',
            secure: true,
            path: '/',
            config: { iceServers },
            debug: 3
        });

        peer.on("open", (id) => {
            myPeer = peer;               // assign globally
            window.myPeer = peer;        // also expose for debugging
            socket.emit('join-room', ROOM_ID, id, USER_ID, user);
            console.log("Peer is ready with ID:", id);
            resolve(peer);
        });
    });
}


// initPeer().then((peer) => {
//     myPeer = peer;
//     console.log("Peer initialized");
// });

backBtn.addEventListener("click", () => {
    document.querySelector(".main__left").style.display = "flex";
    document.querySelector(".main__left").style.flex = "1";
    document.querySelector(".main__right").style.display = "none";
    document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
    document.querySelector(".main__right").style.display = "flex";
    document.querySelector(".main__right").style.flex = "1";
    document.querySelector(".main__left").style.display = "none";
    document.querySelector(".header__back").style.display = "block";
});
const user = CURRENT_USER; //prompt("Enter your name");
const peers = {}

let myVideoStream;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(async stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, USER_ID);

    // Wait until Peer is initialized before using it
    const peer = await initPeer();

    peer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')

        call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream, USER_ID)
        })
    })

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })

    socket.on('user-disconnected', userId => {
        if (peers[userId]) peers[userId].close()
    })
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', (userVideoStream, userId) => {
        addVideoStream(video, userVideoStream, userId)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream, userId) {
    video.srcObject = stream;
    video.controls = true;
    video.addEventListener('loadedmetadata', () => {
        video.play();
        let wrapper = document.createElement('div');
        wrapper.classList.add("video__wrapper");
        wrapper.setAttribute("id", `video_${userId}`);
        wrapper.append(video);
        videoGrid.append(wrapper);
    })
}

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
    if (text.value.length !== 0) {
        socket.emit("message", text.value);
        text.value = "";
    }
});

text.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && text.value.length !== 0) {
        socket.emit("message", text.value);
        text.value = "";
    }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const profile = document.querySelector("#profile");
const logout = document.querySelector("#logout");

profile.addEventListener("click", () => {
    location.href = '/profile?roomId=' + ROOM_ID;
});
logout.addEventListener("click", () => {
    location.href = '/logout';
});
muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        html = `<i class="fas fa-microphone-slash"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
        socket.emit("audio_disabled", ROOM_ID, USER_ID, CURRENT_USER);
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        html = `<i class="fas fa-microphone"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
        socket.emit("audio_enabled", ROOM_ID, USER_ID, CURRENT_USER);
    }
});

stopVideo.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        html = `<i class="fas fa-video-slash"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        html = `<i class="fas fa-video"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    }
});

inviteButton.addEventListener("click", (e) => {
    prompt(
        "Скопируйте эту ссылку на данный видеочат и отправьте ее своим собеседникам (для установки соединения они должны быть также авторизованы на данном сайте)",
        window.location.href
    );
});

socket.on("createMessage", (message, userName, avatarUrl) => {
    if (userName !== null) {
        messages.innerHTML =
            messages.innerHTML +
            `<div class="message">
            <b><img id="chat-avatar" src="${avatarUrl}" alt="Ваша аватарка" /> <span class="message__owner">&nbsp;&nbsp; ${userName === user ? 'Я' : userName
                }</span> </b>
            <span>${message}</span>
            </div>`;
    }
});

socket.on("audioDisabled", (userId, userName) => {
    if (userId !== USER_ID) {
        alert('Пользователь "' + userName + '" выключил свой микрофон');
    }
});

socket.on("audioEnabled", (userId, userName) => {
    if (userId !== USER_ID) {
        alert('Пользователь "' + userName + '" включил свой микрофон');
    }
});