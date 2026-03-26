# 1. 베이스 이미지 설정
FROM node:18-alpine

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일만 먼저 복사 (캐싱 효율)
COPY package*.json ./

# 4. 의존성 설치
RUN npm install

# 5. 나머지 소스 코드 복사 (이때 node_modules는 제외되어야 함)
COPY . .

# 6. 실행 포트 설정 (server.js가 사용하는 포트)
EXPOSE 3000

# 7. 서버 실행
CMD ["node", "server.js"]