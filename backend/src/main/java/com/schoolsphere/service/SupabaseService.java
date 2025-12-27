package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schoolsphere.config.SupabaseConfig;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class SupabaseService {

    @Autowired
    private SupabaseConfig supabaseConfig;

    @Autowired
    private OkHttpClient httpClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getAuthHeader() {
        if (supabaseConfig.hasServiceRoleKey()) {
            return "Bearer " + supabaseConfig.getServiceRoleKey();
        }
        return "Bearer " + supabaseConfig.getAnonKey();
    }

    private String getApiKey() {
        // Use the same key as Authorization header for consistency
        if (supabaseConfig.hasServiceRoleKey()) {
            return supabaseConfig.getServiceRoleKey();
        }
        return supabaseConfig.getAnonKey();
    }

    private String getApiUrl(String table) {
        return supabaseConfig.getSupabaseUrl() + "/rest/v1/" + table;
    }

    public JsonNode get(String table, Map<String, String> filters) throws IOException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(getApiUrl(table)).newBuilder();
        
        if (filters != null) {
            filters.forEach((key, value) -> {
                if (value != null && !value.isEmpty()) {
                    urlBuilder.addQueryParameter(key, "eq." + value);
                }
            });
        }

        Request request = new Request.Builder()
                .url(urlBuilder.build())
                .header("apikey", getApiKey())
                .header("Authorization", getAuthHeader())
                .header("Content-Type", "application/json")
                .header("Prefer", "return=representation")
                .get()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            String responseBody = response.body().string();
            return objectMapper.readTree(responseBody);
        }
    }

    public JsonNode getById(String table, String id) throws IOException {
        HttpUrl url = HttpUrl.parse(getApiUrl(table) + "?id=eq." + id).newBuilder().build();

        Request request = new Request.Builder()
                .url(url)
                .header("apikey", getApiKey())
                .header("Authorization", getAuthHeader())
                .header("Content-Type", "application/json")
                .header("Prefer", "return=representation")
                .get()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            String responseBody = response.body().string();
            JsonNode result = objectMapper.readTree(responseBody);
            return result.isArray() && result.size() > 0 ? result.get(0) : null;
        }
    }

    public JsonNode getIn(String table, String column, List<String> values) throws IOException {
        if (values == null || values.isEmpty()) {
            return objectMapper.createArrayNode();
        }

        // Supabase PostgREST format: column=in.(value1,value2,value3)
        String valuesStr = String.join(",", values);
        HttpUrl.Builder urlBuilder = HttpUrl.parse(getApiUrl(table)).newBuilder();
        urlBuilder.addQueryParameter(column, "in.(" + valuesStr + ")");
        HttpUrl url = urlBuilder.build();

        Request request = new Request.Builder()
                .url(url)
                .header("apikey", getApiKey())
                .header("Authorization", getAuthHeader())
                .header("Content-Type", "application/json")
                .header("Prefer", "return=representation")
                .get()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            String responseBody = response.body().string();
            return objectMapper.readTree(responseBody);
        }
    }

    public JsonNode post(String table, Object data) throws IOException {
        String json = objectMapper.writeValueAsString(data);

        RequestBody body = RequestBody.create(
                json,
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(getApiUrl(table))
                .header("apikey", getApiKey())
                .header("Authorization", getAuthHeader())
                .header("Content-Type", "application/json")
                .header("Prefer", "return=representation")
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                throw new IOException("Unexpected code " + response + ": " + errorBody);
            }
            String responseBody = response.body().string();
            JsonNode result = objectMapper.readTree(responseBody);
            return result.isArray() && result.size() > 0 ? result.get(0) : result;
        }
    }

    public JsonNode put(String table, String id, Object data) throws IOException {
        String json = objectMapper.writeValueAsString(data);

        RequestBody body = RequestBody.create(
                json,
                MediaType.parse("application/json")
        );

        HttpUrl url = HttpUrl.parse(getApiUrl(table) + "?id=eq." + id).newBuilder().build();

        Request request = new Request.Builder()
                .url(url)
                .header("apikey", getApiKey())
                .header("Authorization", getAuthHeader())
                .header("Content-Type", "application/json")
                .header("Prefer", "return=representation")
                .put(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                throw new IOException("Unexpected code " + response + ": " + errorBody);
            }
            String responseBody = response.body().string();
            JsonNode result = objectMapper.readTree(responseBody);
            return result.isArray() && result.size() > 0 ? result.get(0) : result;
        }
    }

    public void delete(String table, String id) throws IOException {
        HttpUrl url = HttpUrl.parse(getApiUrl(table) + "?id=eq." + id).newBuilder().build();

        Request request = new Request.Builder()
                .url(url)
                .header("apikey", getApiKey())
                .header("Authorization", getAuthHeader())
                .header("Content-Type", "application/json")
                .delete()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
        }
    }

    public JsonNode upsert(String table, Object data, String conflictColumn) throws IOException {
        String json = objectMapper.writeValueAsString(data);

        RequestBody body = RequestBody.create(
                json,
                MediaType.parse("application/json")
        );

        String preferHeader = conflictColumn != null 
            ? "resolution=merge-duplicates,return=representation" 
            : "return=representation";

        Request request = new Request.Builder()
                .url(getApiUrl(table))
                .header("apikey", getApiKey())
                .header("Authorization", getAuthHeader())
                .header("Content-Type", "application/json")
                .header("Prefer", preferHeader)
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                throw new IOException("Unexpected code " + response + ": " + errorBody);
            }
            String responseBody = response.body().string();
            return objectMapper.readTree(responseBody);
        }
    }
}
