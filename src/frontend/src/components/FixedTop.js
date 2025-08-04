import React from 'react';
import ReactDOM from 'react-dom';

const fixedTopStyle = {/* 吸顶样式 */
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000
};

 export default class FixedTop extends React.Component{

    constructor(){/* 构造函数 */
        super(...arguments);
        this.state={
            fixedTop:false
        };
        this.node = null;
    }

    componentDidMount(){
        window.document.onscroll=()=>{/* 监听滚动事件 */
            const scrollTop = window.document.body.scrollTop || window.document.documentElement.scrollTop;/* 获取滚动位置 */
            const domNode = ReactDOM.findDOMNode(this.node);/* 获取DOM节点 */
            if(domNode){/* 如果DOM节点存在 */
                this.setState({ fixedTop: scrollTop > domNode.offsetTop });/* 设置吸顶状态 */
            }
        }
    }

    render(){
        return(
            <div ref={node=> this.node = node} 
                 style={ this.state.fixedTop? fixedTopStyle : null} >
                {this.props.children}
            </div>
        );
    }
}

