/**
 * Created by Aaron on 2018/1/15.
 */
import errorCode from './errorCode'
import BusinessException from './businessException'

const role = {
    normal: 0,
    admin: 10,
    superAdmin: 50
};

export default {
    requestSignin: function (req, res, next) {
        let user = req.session.user;
        if(!user){
            next(new BusinessException('请登录', errorCode.requestSignin));
        }else{
            next();
        }
    },
    requestAdmin: function (req, res, next) {
        let user = req.session.user;
        if(!user || user.role < role['admin']){
            next(new BusinessException('需要管理员权限', errorCode.requestAdmin));
        }else{
            next();
        }
    },
    requestSuperAdmin: function (req, res, next) {
        let user = req.session.user;
        if(!user || user.role < role['superAdmin']){
            next(new BusinessException('需要超级管理员权限', errorCode.requestSuperAdmin));
        }else{
            next();
        }
    }
};