import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * API客户端工具类
 * 提供统一的HTTP请求处理和响应解析
 */
public class ApiClient {
    
    private static final String BASE_URL = "http://localhost:8080/api";
    private static final int CONNECT_TIMEOUT = 10000; // 10秒
    private static final int READ_TIMEOUT = 30000; // 30秒
    
    /**
     * HTTP请求方法枚举
     */
    public enum HttpMethod {
        GET, POST, PUT, DELETE
    }
    
    /**
     * API响应类
     */
    public static class ApiResponse {
        private int statusCode;
        private String body;
        private Map<String, String> headers;
        
        public ApiResponse(int statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
            this.headers = new HashMap<>();
        }
        
        public int getStatusCode() {
            return statusCode;
        }
        
        public String getBody() {
            return body;
        }
        
        public Map<String, String> getHeaders() {
            return headers;
        }
        
        public boolean isSuccess() {
            return statusCode >= 200 && statusCode < 300;
        }
        
        @Override
        public String toString() {
            return String.format("ApiResponse{statusCode=%d, body='%s'}", statusCode, body);
        }
    }
    
    /**
     * 发送GET请求
     */
    public static ApiResponse get(String endpoint, String token) throws Exception {
        return request(HttpMethod.GET, endpoint, null, token);
    }
    
    /**
     * 发送POST请求
     */
    public static ApiResponse post(String endpoint, String jsonPayload, String token) throws Exception {
        return request(HttpMethod.POST, endpoint, jsonPayload, token);
    }
    
    /**
     * 发送PUT请求
     */
    public static ApiResponse put(String endpoint, String jsonPayload, String token) throws Exception {
        return request(HttpMethod.PUT, endpoint, jsonPayload, token);
    }
    
    /**
     * 发送DELETE请求
     */
    public static ApiResponse delete(String endpoint, String token) throws Exception {
        return request(HttpMethod.DELETE, endpoint, null, token);
    }
    
    /**
     * 通用HTTP请求方法
     */
    private static ApiResponse request(HttpMethod method, String endpoint, String jsonPayload, String token) throws Exception {
        URL url = new URL(BASE_URL + endpoint);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        // 设置基本属性
        connection.setRequestMethod(method.name());
        connection.setConnectTimeout(CONNECT_TIMEOUT);
        connection.setReadTimeout(READ_TIMEOUT);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("User-Agent", "RoomX-Desktop-Client/1.0");
        
        // 设置认证头
        if (token != null && !token.isEmpty()) {
            connection.setRequestProperty("Authorization", "Bearer " + token);
        }
        
        // 发送请求体
        if (jsonPayload != null && !jsonPayload.isEmpty()) {
            connection.setDoOutput(true);
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
        }
        
        // 获取响应
        int responseCode = connection.getResponseCode();
        
        BufferedReader reader;
        if (responseCode >= 200 && responseCode < 300) {
            reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
        } else {
            reader = new BufferedReader(new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8));
        }
        
        StringBuilder responseBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            responseBody.append(line);
        }
        reader.close();
        
        ApiResponse response = new ApiResponse(responseCode, responseBody.toString());
        
        // 获取响应头
        for (Map.Entry<String, java.util.List<String>> entry : connection.getHeaderFields().entrySet()) {
            if (entry.getKey() != null && entry.getValue() != null && !entry.getValue().isEmpty()) {
                response.getHeaders().put(entry.getKey(), entry.getValue().get(0));
            }
        }
        
        return response;
    }
    
    /**
     * 简单的JSON解析工具方法
     */
    public static class JsonUtils {
        
        /**
         * 从JSON字符串中提取字符串值
         */
        public static String extractString(String json, String key) {
            String pattern = "\"" + key + "\":\"";
            int start = json.indexOf(pattern);
            if (start == -1) return null;
            
            start += pattern.length();
            int end = json.indexOf("\"", start);
            if (end == -1) return null;
            
            return json.substring(start, end);
        }
        
        /**
         * 从JSON字符串中提取整数值
         */
        public static Integer extractInt(String json, String key) {
            String pattern = "\"" + key + "\":";
            int start = json.indexOf(pattern);
            if (start == -1) return null;
            
            start += pattern.length();
            int end = json.indexOf(",", start);
            if (end == -1) {
                end = json.indexOf("}", start);
            }
            if (end == -1) return null;
            
            try {
                return Integer.parseInt(json.substring(start, end).trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        
        /**
         * 从JSON字符串中提取布尔值
         */
        public static Boolean extractBoolean(String json, String key) {
            String pattern = "\"" + key + "\":";
            int start = json.indexOf(pattern);
            if (start == -1) return null;
            
            start += pattern.length();
            int end = json.indexOf(",", start);
            if (end == -1) {
                end = json.indexOf("}", start);
            }
            if (end == -1) return null;
            
            String value = json.substring(start, end).trim();
            return "true".equals(value);
        }
        
        /**
         * 检查JSON字符串是否包含某个键
         */
        public static boolean containsKey(String json, String key) {
            return json.contains("\"" + key + "\":");
        }
    }
    
    /**
     * 构建查询参数字符串
     */
    public static String buildQueryString(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return "";
        }
        
        StringBuilder query = new StringBuilder("?");
        boolean first = true;
        
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!first) {
                query.append("&");
            }
            query.append(entry.getKey()).append("=").append(entry.getValue());
            first = false;
        }
        
        return query.toString();
    }
    
    /**
     * 构建JSON对象字符串
     */
    public static String buildJsonObject(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return "{}";
        }
        
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!first) {
                json.append(",");
            }
            
            Object value = entry.getValue();
            if (value instanceof String) {
                json.append("\"").append(entry.getKey()).append("\":\"").append(value).append("\"");
            } else if (value instanceof Number || value instanceof Boolean) {
                json.append("\"").append(entry.getKey()).append("\":").append(value);
            } else {
                json.append("\"").append(entry.getKey()).append("\":\"").append(value).append("\"");
            }
            
            first = false;
        }
        
        json.append("}");
        return json.toString();
    }
    
    /**
     * 转义JSON字符串中的特殊字符
     */
    public static String escapeJson(String str) {
        if (str == null) return null;
        
        return str.replace("\\", "\\\\")
                 .replace("\"", "\\\"")
                 .replace("\n", "\\n")
                 .replace("\r", "\\r")
                 .replace("\t", "\\t");
    }
} 