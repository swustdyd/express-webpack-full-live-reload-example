import React from 'react'
import { Link } from 'react-router-dom'
import { Tree } from 'antd';
import RouteWithConfig from '../components/routeWithConfig'
import Breadcrumb from '../components/breadcrumb'

const {TreeNode} = Tree;

const routerConfig = [
    {
        path: '/sub1',
        component: () => {return <h2>sub1</h2>},
        text: '菜单1',
        children: [
            {
                path: '/sub1-1',
                text: '菜单1-1',
                component: () => {return <h3>sub1-1</h3>},
                children: [
                    {
                        path: '/sub1-1-1',
                        text: '菜单1-1-1',
                        component: () => {return <h3>sub1-1-1</h3>}
                    }
                ]
            }
        ]
    },
    {
        path: '/sub2',
        text: '菜单2',
        component: () => {return <h2>sub2</h2>},
        children: [
            {
                path: '/sub2-1',
                text: '菜单2-1',
                component: () => {return <h3>sub2-1</h3>}
            }
        ]
    },
    {
        path: '/sub3',
        text: '菜单3',
        component: () => {return <h2>sub3</h2>},
        children: [
            {
                path: '/sub3-1',
                text: '菜单3-1',
                component: () => {return <h3>sub3-1</h3>}
            }
        ]
    }
]



class A {
    constructor(value){
        this._test = value;
    }

    set test(value){
        if(typeof value !== 'number'){
            throw 'test must be a number'
        }else{
            this._test = value;
        }
    }

    get test(){
        return Math.pow(this._test, 2);
    }
}

class AProxy {
    constructor(...params){
        return new Proxy(new A(...params), {
            get: function (target, key, receiver) {
                console.log(`getting ${key}!`);
                return Reflect.get(target, key, receiver);
            },
            set: function (target, key, value, receiver) {
                console.log(`setting ${key}!`);
                return Reflect.set(target, key, value, receiver);
            }
        })
    }
}

export default class RouterWithConfigTest extends React.Component{

    componentDidMount(){
        const aProxy = new AProxy(2);
        //aProxy.test = '45';
        console.log(aProxy.test);
    }
    
    renderTreeNodes(data = [], basePath = ''){
        return data.map((item) => {
            const path = basePath + item.path;
            if (item.children) {
                return (
                    <TreeNode title={<Link to={path}>{item.text}</Link>} key={path}>
                        {this.renderTreeNodes(item.children, path)}
                    </TreeNode>
                );
            }
            return <TreeNode title={<Link to={path}>{item.text}</Link>} key={path}/>;
        });
    }

    render(){
        return (
            <div>
                <h1>RouterWithConfig Test</h1>
                <Tree>                    
                    {this.renderTreeNodes(routerConfig, '/routerTest')}
                </Tree>
                <Breadcrumb config={routerConfig} basePath="/routerTest"/>
                <RouteWithConfig config={routerConfig} basePath="/routerTest"/>
            </div> 
        );
    }
}