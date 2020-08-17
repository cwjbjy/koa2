const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const cors = require('koa2-cors');
const koaBody = require('koa-body');
let api = require('./router')
const WebSocket = require('ws');
 
const wss = new WebSocket.Server({ port: 3999 });
// const Koa_Logger = require("koa-logger");                 // 日志中间件
// const logger = Koa_Logger();  
// app.use(logger);    

app.use(cors({
    origin: function (ctx) {
        return "*"; // 允许来自所有域名请求
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE', 'PUT','PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))

app.use(require('koa-static')(__dirname + '/public'))

// logger

app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.set('X-Response-Time', `${ms}ms`);
   
});

app.use(koaBody());


//每一次连接都会生成一个新的wss实例
wss.on('connection', function connection(ws,req) {
    ws.on('message', function incoming(message) {
      var data = JSON.parse(message);
      console.log('data',data)
      switch(data.type){
        case 'setName':
          ws.nickName = data.name;
          ws.nickImage = data.image;
          broadcast(JSON.stringify({
            name:'系统提示：',
            text:ws.nickName + '加入了房间',
          }));
          break;
        case 'chat':
          broadcast(JSON.stringify({
            name:ws.nickName,
            text:data.text,
            image:ws.nickImage
          }));
          break;
        case 'close':
          broadcast(JSON.stringify({
            name:'系统提示：',
            text:ws.nickName + '离开了房间',
          }));
        case 'heart':
          broadcast(JSON.stringify({
            name:'heart',
            text:data.text
          }));
        default:
          break;
      }
    });
  });
  
  function broadcast(str){
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(str);
      }
    });
  }
  //websocket心跳
  const interval = setInterval(function ping(){
    wss.clients.forEach(function each(ws){
      ws.ping('putong')
    })
  },3000)
  
  wss.on('close', function close() {
    console.log('连接关闭');
    clearInterval(interval)
  });

//装载所有子路由
router.use('/api',api.routes(),api.allowedMethods());
//加载路由中间件
app.use(router.routes(),router.allowedMethods());


//error
//
app.on('error', (err, ctx) => {
    log.error('server error', err, ctx)
});

app.listen(9000,function () {
    console.log('服务启动成功')
});