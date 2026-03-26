/* ==========================================================
   💎 WIKI-ROUTER v5.2 CORE (Optimized)
   ========================================================== */
const App = {
    state: {
        isEngineActive: false,
        socket: null,
        peer: null,
        myPeerId: null,
        localStream: null,
        room: 'DEFAULT_ROOM'
    },

    // 1. 초기화: 소켓과 피어 연결만 담당
    init: function() {
        console.log("💎 System Initialization...");
        this.state.socket = io();
        this.state.peer = new Peer(undefined, {
            path: '/peerjs', host: '/',
            port: location.port || (location.protocol === 'https:' ? 443 : 80)
        });
        this.setupEventListeners();
    },

    // 2. 이벤트 리스너: 서버와의 통신 규격 정의
    setupEventListeners: function() {
        const { peer, socket } = this.state;

        peer.on('open', id => {
            this.state.myPeerId = id;
            document.getElementById('status-display').innerText = `ID: ${id}`;
        });

        peer.on('call', async (call) => {
            if (!this.state.localStream) {
                this.state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            call.answer(this.state.localStream);
            call.on('stream', stream => this.playRemoteAudio(stream));
        });

        socket.on('oi_response', (res) => {
            if(res.success) this.activateSuccess();
        });
    },

    // 3. 엔진 활성화 (로그인/접속 성공 시 호출)
    activate: function() {
        const modeId = document.getElementById('join-id')?.value || 'GUEST';
        const userPw = document.getElementById('join-pw')?.value || '';
        
        this.state.socket.emit('join_room', { 
            modeId, userPw, peerId: this.state.myPeerId 
        });
    },

    activateSuccess: function() {
        this.state.isEngineActive = true;
        document.getElementById('auth-screen').style.display = 'none'; // 인증창 닫기
        document.getElementById('status').innerText = "ONLINE";
        document.getElementById('status').style.color = "#00ff88";
        this.switchView('ptt'); // 초기 화면 설정
    },

    // 4. 화면 전환: 기존 HTML 요소를 직접 껏다 켬 (복잡한 템플릿 삭제)
    switchView: function(viewName) {
        if (!this.state.isEngineActive) return;

        // 모든 뷰 섹션 숨기기 (ID 규칙: ptt-view, phone-view 등)
        document.querySelectorAll('section[id$="-view"]').forEach(sec => {
            sec.style.display = 'none';
        });

        // 선택한 섹션만 표시
        const target = document.getElementById(`${viewName}-view`);
        if (target) {
            target.style.display = 'flex';
            this.updateNavUI(viewName);
        }
    },

    // 5. 핵심 기능: 무전(PTT) 및 전화
    startPTT: function() {
        document.getElementById('p-trig').classList.add('active');
        this.state.socket.emit('ptt-start', { id: this.state.myPeerId });
    },

    stopPTT: function() {
        document.getElementById('p-trig').classList.remove('active');
        this.state.socket.emit('ptt-stop');
    },

    makeCall: async function() {
        const targetId = document.getElementById('dial-number')?.value;
        if (!targetId) return;
        
        this.state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const call = this.state.peer.call(targetId, this.state.localStream);
        call.on('stream', stream => this.playRemoteAudio(stream));
    },

    playRemoteAudio: function(stream) {
        let audio = document.getElementById('remote-audio') || document.createElement('audio');
        audio.id = 'remote-audio';
        audio.srcObject = stream;
        audio.play();
    },

    updateNavUI: function(view) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isTarget = btn.getAttribute('onclick').includes(`'${view}'`);
            btn.classList.toggle('active', isTarget);
        });
    }
};

window.onload = () => App.init();