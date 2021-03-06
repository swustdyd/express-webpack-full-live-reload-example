/**
 * Created by Aaron on 2018/3/2.
 */

import React from 'react'
import { Form, Input, Tooltip, Icon, Button, message, Spin, Select, Modal} from 'antd'
import PicturesWall from '../../components/picturesWall'
import Common from '../../common/common'
import API from '../../confs/api'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import MovieAction from '../../actions/movie/movieAction'

const {TextArea} = Input;
const FormItem = Form.Item;

import './movieEdit.scss'

class MovieEdit extends React.Component{
    constructor(props){
        super(props);
        const { initData } = props;
        const fileList = initData && initData.poster ? [initData.poster] : [];
        this.state = {
            submiting: false,
            initData: initData || {},
            fileList: fileList
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleFileUploadChange = this.handleFileUploadChange.bind(this);
    }
    handleSubmit(e) {
        //console.log('表单提交', e);
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, value) => {
            if(!err && !this.state.submiting){
                const movie = this.props.form.getFieldsValue();
                this.setState({submiting: true});
                movie._id = this.state.initData._id;
                const {fileList} = this.state;
                fileList.forEach((item) => {
                    item.displayName = item.name;
                    item.src = item.url;
                    item.name = undefined;
                    item.url = undefined;
                });
                if(fileList &&  fileList.length > 0){
                    movie.poster = fileList[0];
                }else {
                    movie.poster = '';
                }
                this.props.movieAction.editMovie({
                    movie,
                    fileList
                }, (err, data) => {
                    if(err){
                        message.error(err.message)
                    }else{
                        if(data.success){
                            message.success(data.message);
                            //window.location.href = '/#/moviePage/movieList';
                            if( this.props.onSubmitSuccess){
                                this.props.onSubmitSuccess();
                            }
                        }else{
                            message.error(data.message);
                            if( this.props.onSubmitFail){
                                this.props.onSubmitFail();
                            }
                        }
                    }
                    this.setState({submiting: false})
                })
            }
        });
    }

    handleFileUploadChange(fileList){
        this.setState({
            fileList: fileList
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 4 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 20 }
            }
        };
        const tailFormItemLayout = {
            wrapperCol: {
                xs: {
                    span: 24,
                    offset: 16
                },
                sm: {
                    span: 24,
                    offset: 22
                }
            }
        };
        const { initData, fileList } = this.state;
        fileList.forEach((item, index) => {
            item.uid = index;
            item.name = item.displayName || item.name;
            item.status = 'done';
            item.url = item.src || item.url;
        });
        return (
            <Spin tip="提交中..." spinning={this.state.submiting}>
                <Form onSubmit={this.handleSubmit}>
                    <FormItem
                        {...formItemLayout}
                        label="电影名称"
                    >
                        {getFieldDecorator('title', {
                            rules: [{
                                required: true,
                                message: '请输入电影名称'
                            }],
                            initialValue: initData.title
                        })(
                            <Input />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="导演"
                    >
                        {getFieldDecorator('doctor', {
                            rules: [{
                                required: true,
                                message: '请输入导演'
                            }],
                            initialValue: initData.doctor
                        })(
                            <Input />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="国家"
                    >
                        {getFieldDecorator('country', {
                            rules: [{
                                required: true,
                                message: '请输入国家'
                            }],
                            initialValue: initData.country
                        })(
                            <Input />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="年代"
                    >
                        {getFieldDecorator('year', {
                            rules: [{
                                required: true,
                                message: '请输入年代'
                            }, {
                                pattern: /^[0-9]{4}$/,
                                message: '年代必须为0-4位的数字'
                            }],
                            initialValue: initData.year
                        })(
                            <Input />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="语种"
                    >
                        {getFieldDecorator('language', {
                            rules: [{
                                required: true,
                                message: '请输入语种'
                            }],
                            initialValue: `${initData.language || ''}`
                        })(
                            <Select allowClear>
                                {Common.createOptions()}
                            </Select>
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="简介"
                    >
                        {getFieldDecorator('summary', {
                            rules: [{
                                required: true,
                                message: '请输入电影简介'
                            }],
                            initialValue: initData.summary
                        })(
                            <TextArea placeholder="请输入电影简介" autosize={{minRows: 3, maxRows: 10}}/>
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label={(
                            <span>
                                封面&nbsp;
                                <Tooltip title="文件格式：JPG、PNG">
                                    <Icon type="question-circle-o" />
                                </Tooltip>
                            </span>
                        )}
                    >
                        {getFieldDecorator('posterFile')(
                            <div>
                                <PicturesWall
                                    name="poster"
                                    action={API.uploadPoster}
                                    cutAction={API.cutImg}
                                    cutWidth={350}
                                    cutHeight={350}
                                    maxLength={1}
                                    defaultFileList={fileList}
                                    onChange={this.handleFileUploadChange}
                                />
                            </div>
                        )}
                    </FormItem>
                    <FormItem {...tailFormItemLayout}>
                        <Button type="primary" htmlType="submit" >提交</Button>
                    </FormItem>
                </Form>
            </Spin>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        movieAction: bindActionCreators(MovieAction, dispatch)
    }
};

export default connect(undefined, mapDispatchToProps)(Form.create()(MovieEdit));

// export default Form.create()(MovieEdit);