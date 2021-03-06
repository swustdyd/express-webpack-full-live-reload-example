/**
 * Created by Aaron on 2018/3/2.
 */

import React from 'react'
import {
    Table, Button, message, Popconfirm, Select,
    Divider, Col, Row, Form, Input, DatePicker
} from 'antd'
import { Link } from 'react-router-dom'
import momont from 'moment'
import { bindActionCreators } from 'redux';
import MovieEdit from './movieEdit'
import { connect } from 'react-redux';
import MovieAction from '../../actions/movie/movieAction'
import ModalAction from '../../actions/common/customModal'
import YearRangePicker from '../../components/yearRangePicker'
import Common from '../../common/common'

const FormItem = Form.Item;

class MovieList extends React.Component{
    constructor(){
        super();
        this.state = {
            yearRange: {},            
            total: 0,
            pageIndex: 0,
            pageSize: 10,
            movies: [],
            languages: []
        };
    }
    getSearchCondition(){
        const condition = {};
        const { searchTitle, searchLanguage, searchYear } = this.props.form.getFieldsValue();     
        if(searchYear){
            condition.startYear = searchYear.start;
            condition.endYear = searchYear.end;
        }
        if(searchTitle){
            condition.name = searchTitle;
        }
        if(searchLanguage){
            condition.language = searchLanguage;
        }
        return condition;
    }
    handleDeleteClick(id){
        const {pageIndex} = this.state;
        this.props.movieAction.deleteMovie(id, (err, data) => {
            if(err){
                message.error(err.message);
            }else{
                if(data.success){
                    message.success(data.message);
                    this.searchAndLoadMovies(pageIndex);
                }else{
                    message.error(data.message);
                }
            }
        });
    }
    handleEditClick(id){
        const {pageIndex, pageSize} = this.state;
        const condition = {id};
        this.props.movieAction.searchMovies(condition, 0, pageSize, (err, data) => {
            if(err){
                message.error(err.message);
            }else{
                if(data.success){
                    this.props.modalAction.showModal({
                        title: `编辑电影：${data.result[0].title}`,
                        maskClosable: false,
                        modalContent: <MovieEdit
                            onSubmitSuccess={() => {
                                this.props.modalAction.hideModal();
                                this.searchAndLoadMovies(pageIndex);
                            }}
                            initData={data.result[0]}
                        />,
                        width: 800
                    });
                }else {
                    message.error(data.message);
                }
            }
        });
    }
    handleSearchClick(e){
        e.preventDefault();
        this.searchAndLoadMovies(0, this.getSearchCondition());
    }
    componentDidMount(){
        this.searchAndLoadMovies();
        this.props.movieAction.getLanguage((err, data) => {
            if(err){
                message.error(err.message);
            }else{
                if(data.success){
                    this.setState({
                        languages: data.result
                    })
                }else{
                    message.error(err.message);
                }
            }
        })
    }
    searchAndLoadMovies(pageIndex = 0, condition){
        const {pageSize} = this.state;
        this.props.movieAction.searchMovies(condition, pageIndex, pageSize, (err, data) => {
            if(err){
                message.error(err.message)
            }else {
                if(data.success){
                    this.setState({
                        pageIndex: pageIndex,
                        total: data.total,
                        movies: data.result
                    })
                }else {
                    message.error(data.message)
                }
            }
        });
    }
    handleNewClick(){
        const {pageIndex} = this.state;
        this.props.modalAction.showModal({
            title: '新增电影',
            maskClosable: false,
            modalContent: <MovieEdit
                onSubmitSuccess={() => {
                    this.props.modalAction.hideModal();
                    this.searchAndLoadMovies(pageIndex);
                }}
            />,
            width: 800
        });
    }
    render(){
        const {total, pageIndex, pageSize, movies, languages} = this.state;
        const { getFieldDecorator } = this.props.form;
        const columns = [
            {
                title: '序号',
                key: 'index',
                render: (text, record, index) => { return pageIndex * pageSize + index + 1}
            },
            {
                title: '电影名',
                dataIndex: 'title',
                key: 'title',
                render: (title, record) => {
                    return <a href={`https://movie.douban.com/subject/${record.doubanMovieId}`} target="_blank">{title}</a>
                }
            },
            {
                title: '国家',
                dataIndex: 'country',
                key: 'country'
            },
            {
                title: '语种',
                dataIndex: 'language',
                key: 'language'
            },
            {
                title: '年代',
                dataIndex: 'year',
                key: 'year'
            },
            {
                title: '创建时间',
                dataIndex: 'createAt',
                key: 'createAt',
                render: (time) => { return momont(time).format('YYYY-MM-DD HH:mm:ss')}
            },
            // {
            //     title: '评论',
            //     dataIndex: '_id',
            //     key: 'comment',
            //     render: (id) => { return <Link to={`/moviePage/comment/${id}`} >查看评论</Link>}
            // },
            {
                title: '编辑',
                dataIndex: '_id',
                key: 'edit',
                render: (id) => {
                    return <Button type="primary" size="small" onClick={() => {this.handleEditClick(id)}}> 编辑 </Button>
                }
            },
            {
                title: '删除',
                dataIndex: '_id',
                key: 'delete',
                render: (text, record) => {
                    return (
                        <Popconfirm
                            title={`确认删除“${record.title}”？`}
                            cancelText="取消"
                            okText="确认"
                            onConfirm={() => {this.handleDeleteClick(text)}}
                        >
                            <Button type="danger" size="small">删除</Button>
                        </Popconfirm>
                    );
                }
            }
        ];
        const pagination = {
            total: total,
            pageSize: pageSize,
            current: pageIndex + 1,
            onChange: (pageIndex) => {
                this.searchAndLoadMovies(pageIndex - 1, this.getSearchCondition())
            }
        };
        const colLayout = {
            xs: 24,
            sm: 24,
            md: 12,
            lg: 8,
            xl: 8
        };
        const formItemLayout = {
            labelCol:{
                span: 4
            },
            wrapperCol: {
                span: 20
            }
        };
        return(
            <Form onSubmit={(e) => {this.handleSearchClick(e)}}>
                <Row gutter={12}>
                    <Col xl={6}>
                        <FormItem {...formItemLayout} label="电影名">
                            {getFieldDecorator('searchTitle')(
                                <Input />
                            )}
                        </FormItem>
                    </Col>
                    <Col xl={8}>
                        <FormItem labelCol={{span: 4}} wrapperCol={{span: 20}} label="年代">
                            {getFieldDecorator('searchYear')(
                                <YearRangePicker />
                            )}
                        </FormItem>
                    </Col>
                    <Col xl={6}>
                        <FormItem {...formItemLayout} label="语言">
                            {getFieldDecorator('searchLanguage')(
                                <Select 
                                    allowClear
                                    showSearch
                                    filterOption={(inputValue, option) => {
                                        const reg = new RegExp(inputValue);
                                        return reg.test(option.props.children);
                                    }}
                                >
                                    {Common.createOptions(languages, 'languageName', 'languageId')}
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                </Row>
                <Row>
                    <Button type="primary" htmlType="submit" icon="search">搜索</Button>
                    {/* &emsp;
                    <Button type="primary" icon="plus-circle-o" onClick={() => {this.handleNewClick()}}>新增电影</Button> */}
                </Row>
                <Divider />
                <Table
                    columns={columns}
                    dataSource={movies}
                    pagination={pagination}
                />
            </Form>
        );
    }
}
const mapStateToPros = (state) => {
    return {
        movieState: state.movie
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        movieAction: bindActionCreators(MovieAction, dispatch),
        modalAction: bindActionCreators(ModalAction, dispatch)
    }
};

export default connect(mapStateToPros, mapDispatchToProps)(Form.create()(MovieList));
//export default Form.create()(MovieList);