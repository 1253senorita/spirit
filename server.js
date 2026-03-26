/* ==========================================================
   🍎 SPIRIT v5.2 HYBRID SERVER ENGINE
   ========================================================== */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e7 // 10MB (음성 데이터 대응)
});

// 1. PeerJS 서버 설정 (P2P 음성 통신용)
const peerServer = ExpressPeerServer(server, { debug: false, path: '/' });
app.use('/peerjs', peerServer);
app.use(express.static(path.join(__dirname, 'public')));

// [권한 데이터] - 필요시 DB 연동 가능
const USER_MODES = {
    'DEV_MASTER': { text: "관리자 모드", pw: '1234' },
    'GUEST_USER': { text: "게스트 모드", pw: '0000' }
};

/* ==========================================================
   🍇 SOCKET.IO HUB (실시간 이벤트 중계)
   ========================================================== */
io.on('connection', (socket) => {
    const userId = socket.id.substring(0, 5);
    console.log(`📡 [CONN] User Connected: ${userId}`);

    // [1] 인증 및 방 입장 (클라이언트 App.activate와 연동)
    socket.on('join_room', (data) => {
        const { modeId, userPw, peerId } = data;
        const modeData = USER_MODES[modeId];

        if (modeData && userPw === modeData.pw) {
            socket.join(modeId);
            socket.myRoom = modeId;
            socket.peerId = peerId;

            // 인증 성공 응답 및 기존 인원에게 알림
            socket.emit('oi_response', { success: true, text: `${modeData.text} 접속` });
            socket.to(modeId).emit('user-connected', peerId);
            console.log(`✅ [AUTH] ${userId} -> Room: ${modeId}`);
        } else {
            socket.emit('oi_response', { success: false, text: "❌ 인증 실패" });
        }
    });

    // [2] PTT 상태 중계 (누구의 마이크가 켜졌는지 알림)
    socket.on('ptt-start', (data) => {
        if (!socket.myRoom) return;
        socket.to(socket.myRoom).emit('ptt-receiving', { id: data.id });
    });

    socket.on('ptt-stop', () => {
        if (!socket.myRoom) return;
        socket.to(socket.myRoom).emit('ptt-stopped');
    });

    // [3] 음성 데이터 스트리밍/파일 중계
    socket.on('sync-audio-file', (data) => {
        if (!socket.myRoom || !data.blob) return;
        
        // 서버 저장 로직 제거 (속도와 용량 최적화): 클라이언트간 즉시 중계만 수행
        socket.to(socket.myRoom).emit('receive-sync-audio', {
            blob: data.blob,
            id: userId
        });
    });

    socket.on('disconnect', () => {
        if (socket.myRoom && socket.peerId) {
            socket.to(socket.myRoom).emit('user-disconnected', socket.peerId);
        }
        console.log(`🔌 [DISCONN] ${userId}`);
    });
});

/* ==========================================================
   🍓 NETWORK BOOTSTRAP (IP 확인용)
   ========================================================== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    const interfaces = os.networkInterfaces();
    let ip = '127.0.0.1';
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) ip = iface.address;
        }
    }
    console.log(`\n🚀 SPIRIT v5.2 HYBRID ENGINE ONLINE`);
    console.log(`🔗 Local: http://localhost:${PORT} | Mobile: http://${ip}:${PORT}\n`);
});