//格式化输出信息
//const morgan = require('morgan');
import morgan from 'morgan'
import compression from 'compression'
import fs from 'fs'
import errorHandle from './common/errorHandle'
import express from 'express'
import path from 'path'
import mongoose from 'mongoose'
import mysqldb from './common/mysqldb'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import connectMongo from 'connect-mongo'
import filter from './common/filter'
import BaseConfig from '../../baseConfig'
import router from './routes'
import expandResponse from './common/expandResponse'

const MongoStore = connectMongo(session);
const isDev = process.env.NODE_ENV !== 'production';
const app = express();

let serverPort = process.env.PORT || BaseConfig.serverPort;
serverPort = parseInt(serverPort, 10);

const options = {
    //poolSize: 20// Maintain up to 10 socket connections
}

mongoose.connect(BaseConfig.dbConnectString, options);

//开启gzip
app.use(compression());
app.use(bodyParser());
//filter
app.use(filter);
app.use(cookieParser());
app.use(session({
    secret: 'demo',
    store: new MongoStore({
        mongooseConnection: mongoose.connection
        //ttl: 30 * 60// 30 minute 存储在mongo的有效时间，默认为14天，过期后会自动删除
    }),
    cookie: {
        maxAge: 30 * 60 * 1000// 30 minute session和cookie的有效时间，默认是浏览器关闭，该设置优先级大于ttl
    },
    rolling: true,
    resave: true,
    saveUninitialized: false
}));

if(isDev){
    app.use(morgan('dev'));
}else{
    app.use(morgan('combined', {
        stream: fs.createWriteStream(path.join(BaseConfig.root, 'logs/access.log'))
    }));
}

app.use(express.static(path.join(BaseConfig.root, 'public')));//设置静态目录

//在引用所有路由前，可在此做拦截器
app.use(function (req, res, next) {
    //console.log("locals.user: " + app.locals.user);
    //当session过期之后，需要手动删除app.locals.user，系统不会自动删除
    if(req.session.user){
        app.locals.user = req.session.user.name;
    }else{
        delete app.locals.user;
    }
    res.header('Access-Control-Allow-Origin', `${BaseConfig.clientHost}:${BaseConfig.clientPort}`);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

//扩展response的方法
app.use(expandResponse);

//设置路由
app.use(router);

//统一处理异常返回
app.use(errorHandle);

   
app.listen(serverPort, function () {
    console.log(`Demo(${process.env.NODE_ENV}) is running on port ${serverPort}`);
});

// const cluster = require('cluster');
// const numCPUs = require('os').cpus().length;

// if(isDev){    
//     app.listen(serverPort, function () {
//         console.log(`Demo(${process.env.NODE_ENV}) is running on port ${serverPort}`);
//     });
// }else{
//     if (cluster.isMaster) {
//         console.log(`主进程 ${process.pid} 正在运行`);
      
//         // 衍生工作进程。
//         for (let i = 0; i < numCPUs; i++) {
//             cluster.fork();
//         }
      
//         cluster.on('exit', (worker, code, signal) => {
//             console.log(`工作进程 ${worker.process.pid} 已退出`);
//         });
//     } else {
//         // 工作进程可以共享任何 TCP 连接。
//         // 在本例子中，共享的是一个 HTTP 服务器。
//         // http.createServer((req, res) => {
//         //     res.writeHead(200);
//         //     res.end('你好世界\n');
//         // }).listen(8000);
    
//         app.listen(serverPort, function () {
//             console.log(`Demo(${process.env.NODE_ENV}) is running on port ${serverPort}`);
//         });
      
//         console.log(`工作进程 ${process.pid} 已启动`);
//     }
// }
