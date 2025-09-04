/**
 * WebSocket服务
 * 用于处理实时通知推送
 */

class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000; // 5秒重连间隔
        this.listeners = new Map();
        this.isConnected = false;
        this.userId = null;
        this.heartbeatInterval = null;
    }

    /**
     * 连接WebSocket
     * @param {number} userId 用户ID (暂时保留用于兼容性)
     * @param {string} token JWT认证token
     */
    connect(userId, token = null) {
        if (!userId) {
            console.warn('[WebSocket] 连接失败: 用户ID不能为空');
            return;
        }

        // 获取JWT token
        if (!token) {
            token = localStorage.getItem('token');
        }
        
        if (!token) {
            console.warn('[WebSocket] 连接失败: JWT token不能为空');
            return;
        }

        this.userId = userId;
        this.token = token;
        console.log(`[WebSocket] 开始连接 userId=${userId}, token=${token ? '已提供' : '未提供'}`);
        console.log(`[WebSocket] 🔍 连接时监听器状态: ${this.listeners.size} 个事件类型，详情:`, Array.from(this.listeners.keys()));
        
        // 如果已经连接，先断开
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('[WebSocket] 检测到现有连接，先断开');
            this.disconnect();
        }

        try {
            // 构建WebSocket URL - 连接到后端服务器
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // 开发环境连接到后端服务器端口8080，生产环境使用当前域名
            const isDevelopment = window.location.port === '3000';
            const backendHost = isDevelopment ? 'localhost:8080' : window.location.host;
            const wsUrl = `${protocol}//${backendHost}/ws/notifications?token=${encodeURIComponent(token)}`;
            
            console.log(`[WebSocket] 构建连接URL: ${protocol}//${backendHost}/ws/notifications?token=[HIDDEN]`);
            console.log(`[WebSocket] 当前页面信息: protocol=${window.location.protocol}, host=${window.location.host}, port=${window.location.port}`);
            console.log(`[WebSocket] 目标后端服务器: ${backendHost}`);
            
            this.ws = new WebSocket(wsUrl);
            console.log(`[WebSocket] WebSocket对象已创建，当前状态: ${this.getConnectionState()}`);

            this.ws.onopen = (event) => {
                console.log('[WebSocket] ✅ 连接已建立');
                console.log('[WebSocket] 连接事件详情:', event);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.emit('connected', event);
                
            };

            this.ws.onmessage = (event) => {
                try {
                    console.log('[WebSocket] 📨 收到原始消息:', event.data);
                    const message = JSON.parse(event.data);
                    console.log('[WebSocket] 📨 解析后的消息:', message);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[WebSocket] ❌ 解析消息失败:', error);
                    console.error('[WebSocket] 原始数据:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                console.log(`[WebSocket] 🔌 连接关闭: code=${event.code}, reason="${event.reason}", wasClean=${event.wasClean}`);
                console.log('[WebSocket] 关闭事件详情:', event);
                this.isConnected = false;
                this.stopHeartbeat();
                this.emit('disconnected', event);
                
                // 如果不是主动关闭，尝试重连
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log(`[WebSocket] 🔄 准备重连... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                    this.scheduleReconnect();
                } else if (event.code !== 1000) {
                    console.warn('[WebSocket] ⛔ 重连次数已达上限，停止重连');
                }
            };

            this.ws.onerror = (error) => {
                console.error('[WebSocket] ❌ 连接错误:', error);
                console.error('[WebSocket] WebSocket状态:', this.getConnectionState());
                console.error('[WebSocket] WebSocket URL:', this.ws?.url);
                this.emit('error', error);
            };

        } catch (error) {
            console.error('[WebSocket] ❌ 创建连接时发生异常:', error);
            console.error('[WebSocket] 异常堆栈:', error.stack);
            this.emit('error', error);
        }
    }

    /**
     * 断开WebSocket连接
     */
    disconnect() {
        console.log('[WebSocket] 🔌 主动断开连接');
        if (this.ws) {
            console.log(`[WebSocket] 当前连接状态: ${this.getConnectionState()}`);
            this.ws.close(1000, 'User disconnect');
            this.ws = null;
        }
        this.isConnected = false;
        this.stopHeartbeat();
        // 不清空监听器，这样重连后监听器仍然有效
        // this.listeners.clear(); // 注释掉这行
        console.log('[WebSocket] 连接已清理完成（保留监听器）');
    }

    /**
     * 完全销毁WebSocket连接和所有监听器（仅在组件卸载时使用）
     */
    destroy() {
        console.log('[WebSocket] 🗑️ 完全销毁WebSocket服务');
        this.disconnect();
        this.listeners.clear();
        console.log('[WebSocket] 服务已完全销毁');
    }

    /**
     * 处理收到的消息
     */
    handleMessage(message) {
        console.log(`[WebSocket] 🎯 处理消息类型: ${message.type}`);
        
        switch (message.type) {
            case 'CONNECTION_ESTABLISHED':
                console.log('[WebSocket] ✅ 收到连接确认:', message.data);
                break;
            case 'NEW_NOTIFICATION':
                console.log('[WebSocket] 🔔 收到新通知:', message.data);
                console.log('[WebSocket] 📡 准备触发 newNotification 事件...');
                this.emit('newNotification', message.data);
                console.log('[WebSocket] ✅ newNotification 事件已触发');
                break;
            case 'PONG':
                console.log('[WebSocket] 💓 收到心跳响应');
                break;
            default:
                console.log(`[WebSocket] ❓ 收到未知消息类型: ${message.type}`, message);
        }
    }

    /**
     * 发送消息
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const payload = typeof message === 'object' ? JSON.stringify(message) : message;
            console.log(`[WebSocket] 📤 发送消息:`, payload);
            this.ws.send(payload);
        } else {
            console.warn(`[WebSocket] ⚠️ 无法发送消息，连接状态: ${this.getConnectionState()}`);
        }
    }

    /**
     * 开始心跳检测
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send('ping');
            }
        }, 30000); // 30秒心跳
    }

    /**
     * 停止心跳检测
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * 安排重连
     */
    scheduleReconnect() {
        this.reconnectAttempts++;
        console.log(`[WebSocket] ⏰ 安排重连: 尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}，${this.reconnectInterval/1000}秒后执行`);
        console.log(`[WebSocket] 🔍 重连前监听器状态: ${this.listeners.size} 个事件类型`);
        
        setTimeout(() => {
            if (this.userId) {
                console.log(`[WebSocket] 🔄 执行重连...`);
                console.log(`[WebSocket] 🔍 重连时监听器状态: ${this.listeners.size} 个事件类型`);
                this.connect(this.userId);
            }
        }, this.reconnectInterval);
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        console.log(`[WebSocket] 📝 注册事件监听器: ${event}`);
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        console.log(`[WebSocket] ✅ 事件 '${event}' 监听器注册完成，当前监听器数量: ${this.listeners.get(event).length}`);
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        console.log(`[WebSocket] 🗑️ 移除事件监听器: ${event}`);
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                console.log(`[WebSocket] ✅ 事件 '${event}' 监听器移除成功，剩余监听器数量: ${callbacks.length}`);
            } else {
                console.warn(`[WebSocket] ⚠️ 事件 '${event}' 监听器未找到，无法移除`);
            }
        } else {
            console.warn(`[WebSocket] ⚠️ 事件 '${event}' 不存在，无法移除监听器`);
        }
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        console.log(`[WebSocket] 🚀 触发事件: ${event}, 监听器数量: ${this.listeners.has(event) ? this.listeners.get(event).length : 0}`);
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            console.log(`[WebSocket] 📋 执行 ${callbacks.length} 个监听器...`);
            callbacks.forEach((callback, index) => {
                try {
                    console.log(`[WebSocket] 📞 执行监听器 ${index + 1}/${callbacks.length}`);
                    callback(data);
                    console.log(`[WebSocket] ✅ 监听器 ${index + 1} 执行成功`);
                } catch (error) {
                    console.error(`[WebSocket] ❌ 监听器 ${index + 1} 执行错误:`, error);
                }
            });
        } else {
            console.warn(`[WebSocket] ⚠️ 没有找到事件 '${event}' 的监听器`);
        }
    }

    /**
     * 获取监听器状态（用于调试）
     */
    getListeners() {
        return this.listeners;
    }

    /**
     * 获取连接状态
     */
    getConnectionState() {
        if (!this.ws) return 'CLOSED';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }
}

// 创建单例实例
const webSocketService = new WebSocketService();

export default webSocketService;
