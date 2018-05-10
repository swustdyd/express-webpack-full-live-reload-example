/**
 * Created by Aaron on 2018/5/3.
 */
import baseConfig from '../../../baseConfig'
let api = {
    checkLogin: 'user/checkLogin',
    getMovies: 'movie/getMovies',
    postComment: 'comment/commit',
    getComment: 'comment/getComment',
    cutImg: 'util/cutImg',
    newOrUpdateMovie: 'movie/newOrUpdate',
    deleteMovie: 'movie/delete',
    uploadPoster: 'movie/uploadPoster',
    getMoviesByGroup: 'movie/getMoviesByGroup',
    signup: 'user/signup',
    signin: 'user/signin',
    logout: 'user/logout',
    getUsers: 'user/getUsers',
    updatePwd: 'user/updatePwd',
    deleteUser: 'user/delete',
    editUser: 'user/edit',
    uploadIcon: 'user/uploadIcon'
};

for(let key in api){
    api[key] = `${baseConfig.serverHost}:${baseConfig.serverPort}/${api[key]}`;
}

export default api;