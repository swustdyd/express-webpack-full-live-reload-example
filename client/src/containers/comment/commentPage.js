/**
 * Created by Aaron on 2018/1/17.
 */
import React from 'react'
import { Spin, Input, Button, message} from 'antd'
import Common from '../../common/common'
import CommentItem from './commentItem'
import API from '../../common/api'

import './commentPage.scss'

const { TextArea } = Input;

class CommentPage extends  React.Component{
    constructor(props){
        super(props);
        const movieId = Common.getCurrentMenuKey({level: 3});
        this.state = {
            movie: {
                _id: movieId
            },
            loaded: true,
            comments: [],
            inputComment: '',
            pageIndex: 0,
            pageSize: 2,
            total:0,
            totalComments: 0,
            latestCommentMap: {}
        };
        this.handlerCommentInputChange = this.handlerCommentInputChange.bind(this);
        this.handleCommentCommitClick = this.handleCommentCommitClick.bind(this)
    }

    componentDidMount(){
        const { movie, pageIndex, pageSize } = this.state;
        fetch(`${API.getMovies}?condition=${JSON.stringify({_id: movie._id})}`)
            .then((res) => {
                return res.json()
            }).then((data) => {
                this.setState({
                    movie: data.result[0]
                });
                this.getComments(pageIndex, pageSize);
            });
    }

    getComments(pageIndex, pageSize){
        const { movie, comments, latestCommentMap} = this.state;
        fetch(`${API.getComment}/${movie._id}/?pageIndex=${pageIndex || 0}&pageSize=${pageSize || 10}&level=1`)
            .then((res) => {
                return res.json()
            }).then((data) => {
                if(data.success){
                    data.result.forEach((item, index) => {
                        const obj = latestCommentMap[item._id];
                        if(obj){
                            data.result.splice(index, 1);
                        }
                    });
                    comments.push(...data.result);
                    this.setState({
                        loaded: true,
                        comments: comments,
                        pageIndex: data.pageIndex,
                        pageSize: data.pageSize,
                        total: data.total,
                        totalComments: data.totalComments
                    });
                }else{
                    message.error(data.message)
                }
                
            })
            .catch((err) => {
                message.error(err.message);
                this.setState({
                    loaded: true
                })
            });
        this.setState({
            loaded: false
        });
    }

    showMovieDetail(movie){
        const results = [];
        results.push(
            <div key="title" style={{ wordBreak: 'break-all'}}>
                <b>名称:</b> {movie.title}
            </div>,
            <div key='country' style={{ wordBreak: 'break-all'}}>
                <b>国家:</b> {movie.country}
            </div>,
            <div key='language' style={{ wordBreak: 'break-all'}}>
                <b>语言:</b> {movie.language}
            </div>,
            <div key='summary' style={{ wordBreak: 'break-all'}}>
                <b>简介:</b> {movie.summary}
            </div>
        )
        return results;
    }

    handlerCommentInputChange(e){
        this.setState({
            inputComment: e.target.value
        })
    }

    handleCommentCommitClick(){
        const { inputComment, movie, pageIndex, pageSize, comments, latestCommentMap} = this.state;
        if(inputComment){
            const comment = {
                movie: movie._id,
                content: inputComment,
                level: 1
            };
            fetch(API.postComment, {
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                //同域名下，会带上cookie，否则后端根据sessionid获取不到对应的session
                credentials: 'include',
                body: JSON.stringify({
                    comment: comment
                })
            }).then((res) => {
                return res.json()
            }).then((data) => {
                if(data.success){
                    message.success('评论成功');
                    comments.push(data.result);
                    latestCommentMap[data.result._id] = data.result;
                    this.setState({
                        inputComment: '',
                        comments: comments,
                        total: data.total,
                        latestCommentMap: latestCommentMap
                    });
                }else {
                    message.error(data.message);
                }
            })
        }else{
            message.error('请输入评论');
        }
    }

    showComments(comments){
        const results = [];
        comments.forEach((item, index) => {
            results.push(<CommentItem key={index} comment={item} level={1}/>);
        });
        return results;
    }

    getNextPageComment(){
        let { pageIndex } = this.state;
        pageIndex++;
        this.getComments(pageIndex, this.state.pageSize);
    }

    getPageControl(){
        const { comments, total, loaded} = this.state;
        const hasNextPage =  total > comments.length;
        return(
            <Spin tip="评论加载中..." spinning={!loaded}>
                <div className="page-control">
                    {
                        loaded ?
                            hasNextPage ?
                                <i>
                                    <a onClick={() => {this.getNextPageComment()}}>
                                        点击加载更多（{total - comments.length}）条评论
                                    </a>
                                </i>
                                :
                                <i>无更多评论</i>
                            :
                            ''
                    }
                </div>
            </Spin>
        )
    }

    render(){
        const { movie, comments, inputComment, total} = this.state;
        return(
            <div>
                { this.showMovieDetail(movie) }
                <div className="comment-area">
                    <TextArea
                        placeholder="输入评论..."
                        autosize={{ minRows: 2, maxRows: 6 }}
                        onChange={this.handlerCommentInputChange}
                        value={inputComment}
                    />
                    <Button onClick={this.handleCommentCommitClick} type='primary'>评论</Button>
                </div>
                已有评论（{total}）条
                <div className="comment-list">
                    {this.showComments(comments)}
                    {this.getPageControl()}
                </div>
            </div>
        );
    }
}

export default CommentPage;
