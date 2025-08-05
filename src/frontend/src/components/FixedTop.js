import React, { useState, useEffect, useRef } from 'react';

const fixedTopStyle = {/* 吸顶样式 */
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000
};

export default function FixedTop({ children }) {
    const [fixedTop, setFixedTop] = useState(false);
    const nodeRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {/* 监听滚动事件 */
            const scrollTop = window.document.body.scrollTop || window.document.documentElement.scrollTop;/* 获取滚动位置 */
            if (nodeRef.current) {/* 如果DOM节点存在 */
                const shouldBeFixed = scrollTop > nodeRef.current.offsetTop;
                setFixedTop(shouldBeFixed);/* 设置吸顶状态 */
                
                // 调试信息
                if (process.env.NODE_ENV === 'development') {
                    console.log('Scroll position:', scrollTop, 'Offset top:', nodeRef.current.offsetTop, 'Fixed:', shouldBeFixed);
                }
            }
        };

        window.document.addEventListener('scroll', handleScroll);
        
        // 清理事件监听器
        return () => {
            window.document.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div ref={nodeRef} 
             style={fixedTop ? fixedTopStyle : null}>
            {children}
        </div>
    );
}

