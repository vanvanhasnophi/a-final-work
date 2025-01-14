import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.io.*;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

public class JSONSettingsManager {
    private static final Logger LOGGER = Logger.getLogger(JSONSettingsManager.class.getName());
    private static final String SETTINGS_FILE = "settings.json";
    private HashMap<String,String> settings;
    private final Gson gson;

    public JSONSettingsManager() {
        gson = new GsonBuilder().setPrettyPrinting().create();
        settings = new HashMap<>();
        loadSettings();
    }

    // 加载设置
    public void loadSettings() {
        try (Reader reader = new FileReader(SETTINGS_FILE)) {
            Type type = new TypeToken<HashMap<String, String>>(){}.getType();
            settings = gson.fromJson(reader, type);
        } catch (IOException e) {
            LOGGER.log(Level.WARNING,"Failed to load the file.");
        }
    }

    // 保存设置
    public void saveSettings() {
        try (Writer writer = new FileWriter(SETTINGS_FILE)) {
            gson.toJson(settings, writer);
        } catch (IOException e) {
            LOGGER.log(Level.WARNING,"Failed to write to the file.");
        }
    }

    // 设置键值对
    public void setSetting(String key, String value) {
        settings.put(key, value);
    }

    // 获取设置值
    public String getSetting(String key, String defaultValue) {
        return settings.getOrDefault(key, defaultValue);
    }

}

