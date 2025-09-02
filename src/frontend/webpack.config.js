const path = require('path');

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'bundle.js',
		publicPath: '/',
	},
	devServer: {
		static: path.join(__dirname, 'public'),
		port: 3000,
		allowedHosts: ['localhost', '127.0.0.1'], // 可加外网域名
		hot: true,
		historyApiFallback: true,
		open: true,
	},
	// 其他配置可按需补充
};