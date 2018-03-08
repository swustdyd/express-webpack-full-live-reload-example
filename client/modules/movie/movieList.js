/**
 * Created by Aaron on 2018/3/2.
 */

import React from 'react'
import {
    Table, Button, message, Popconfirm,
    Divider, Col, Row, Form, Input, Modal
} from 'antd'
import MovieEdit from './movieEdit'
const FormItem = Form.Item;
class MovieList extends React.Component{
    constructor(){
        super();
        this.state = {
            movies: [],
            modalTitle: '',
            modalVisible: false,
            modalContent: ''
        };
    }
    handleDeleteClick(id){
        //console.log(id);
        let _this = this;
        fetch(`/movie/delete?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if(data.success){
                message.success(data.message);
                _this.loadMovieList();
            }else{
                message.error(data.message);
            }
        });
    }
    handleEditClick(id, title){
        let condition = {
            _id: id
        };
        let _this = this;
        fetch(`/movie/getMovies?condition=${JSON.stringify(condition)}`)
            .then(res => res.json())
            .then(data => {
                this.setState({
                    modalTitle: title,
                    modalVisible: true,
                    modalContent: <MovieEdit
                        onSubmitSuccess={() => {
                            _this.handleModalCancel();
                            _this.loadMovieList();
                        }}
                        initData={data.result[0]}
                    />
                });
            }).catch(err => {
                message.error(err.message);
        });
    }
    handleSearch(){

    }
    componentDidMount(){
        this.loadMovieList();
    }
    loadMovieList(){
        let _this = this;
        fetch('/movie/getMovies')
        .then(res => res.json())
        .then(data => {
            if(data.result && data.result.length > 0){
                data.result.forEach(function (item) {
                    item.key = item._id;
                });
            }
            _this.setState({
                movies: data.result
            })
        });
    }
    handleModalCancel(){
        this.setState({
            modalVisible: false
        });
    }
    handleNewClick(){
        this.setState({
            modalTitle: '新增电影',
            modalVisible: true,
            modalContent: <MovieEdit
                onSubmitSuccess={this.loadMovieList}
            />
        });
    }
    render(){
        let columns = [
            {
                title: '电影名',
                dataIndex: 'title',
                key: 'title'
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
                title: '编辑',
                dataIndex: '_id',
                key: 'edit',
                render: (text, record) =>
                    <Button type="primary" size="small" onClick={this.handleEditClick.bind(this, text, record.title)}>
                        编辑
                    </Button>
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
                            onConfirm={this.handleDeleteClick.bind(this, text)}
                        >
                            <Button type="danger" size="small">删除</Button>
                        </Popconfirm>
                    );
                }
            }
        ];
        const { getFieldDecorator } = this.props.form;
        return(
            <div>
                <Form onSubmit={() => this.handleSearch()}>
                    <Row gutter={24}>
                        <Col span={8}>
                            <FormItem label="电影名">
                                {getFieldDecorator(`searchTitle`)(
                                    <Input placeholder="电影名称" />
                                )}
                            </FormItem>
                        </Col>
                        <Col span={8}>
                            <FormItem label="年代">
                                {getFieldDecorator(`searchYear`,{
                                    rules: [{
                                        message: "年代必须为0-4位的数字",
                                        pattern: /^[0-9]{4}$/
                                    }]
                                })(
                                    <Input span={6}/>
                                )}
                            </FormItem>
                        </Col>
                        <Col span={8}>
                            <FormItem label="语言">
                                {getFieldDecorator(`searchLanguage`)(
                                    <Input span={6}/>
                                )}
                            </FormItem>
                        </Col>
                    </Row>
                    <Row span={24}>
                        <Col span={24}>
                            <Button type="primary" icon="plus-circle-o" onClick={this.handleNewClick.bind(this)}>新增电影</Button>
                            &emsp;
                            <Button type="primary" icon="search">搜索</Button>
                        </Col>
                    </Row>
                    <Divider />
                    <Row span={24}>
                        <Table columns={columns} dataSource={this.state.movies}/>
                    </Row>
                </Form>
                <Modal
                    title={this.state.modalTitle}
                    visible={this.state.modalVisible}
                    maskClosable={false}
                    destroyOnClose={true}
                    onCancel={this.handleModalCancel.bind(this)}
                    footer={null}
                    width={800}
                    style={{top: '20px'}}
                >
                    {this.state.modalContent}
                </Modal>
            </div>
        );
    }
}
export default Form.create()(MovieList);