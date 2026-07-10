package com.example.keeper.systems.ai_ask.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class JinaEmbeddingClient {

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper objectMapper;

    public JinaEmbeddingClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Value("${jina.api.key}")
    private String apiKey;

    private static final String URL =
            "https://api.jina.ai/v1/embeddings";

    public float[] embed(String text) throws IOException {
        List<float[]> embeddings = embedAll(List.of(text));
        if (embeddings.isEmpty()) {
            throw new RuntimeException("Jina response did not include an embedding");
        }
        return embeddings.get(0);
    }

    public List<float[]> embedAll(List<String> texts) throws IOException {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }

        Map<String, Object> requestBody = Map.of(
                "model", "jina-embeddings-v5-text-small",
                "task", "retrieval.query",
                "normalized", true,
                "input", texts
        );
        String json = objectMapper.writeValueAsString(requestBody);

        System.out.println("===== JINA REQUEST =====");
        System.out.println(json);

        Request request = new Request.Builder()
                .url(URL)
                .addHeader(
                        "Authorization",
                        "Bearer " + apiKey
                )
                .addHeader(
                        "Content-Type",
                        "application/json"
                )
                .post(
                        RequestBody.create(
                                json,
                                MediaType.get("application/json")
                        )
                )
                .build();

        try (Response response =
                     client.newCall(request).execute()) {

            String body =
                    response.body().string();

            System.out.println("===== JINA STATUS =====");
            System.out.println(response.code());

            System.out.println("===== JINA RESPONSE =====");
            System.out.println(body);

            if (!response.isSuccessful()) {
                throw new RuntimeException(
                        "Jina Error: " + body
                );
            }

            JsonNode root =
                    objectMapper.readTree(body);

            JsonNode dataNode = root.path("data");
            if (!dataNode.isArray()) {
                throw new RuntimeException("Jina response data is not an array");
            }

            List<float[]> vectors = new ArrayList<>();
            for (JsonNode itemNode : dataNode) {
                JsonNode embeddingNode = itemNode.path("embedding");
                float[] vector =
                        new float[embeddingNode.size()];

                for (int i = 0; i < embeddingNode.size(); i++) {
                    vector[i] =
                            embeddingNode.get(i)
                                    .floatValue();
                }

                vectors.add(vector);
            }

            System.out.println(
                    "Embedding count = "
                            + vectors.size()
            );

            return vectors;
        }
    }
}
