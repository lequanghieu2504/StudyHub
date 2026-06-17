package com.example.keeper.systems.ai_ask.service.impl;

import com.example.keeper.systems.ai_ask.entity.AiConversation;
import com.example.keeper.systems.ai_ask.entity.AiMessage;
import com.example.keeper.systems.ai_ask.repository.AiConversationRepository;
import com.example.keeper.systems.ai_ask.repository.AiMessageRepository;
import com.example.keeper.systems.ai_ask.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl
        implements ConversationService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    @Value("${groq.model}")
    private String model;

    @Override
    public AiConversation createConversation(UUID userId, String title, UUID documentId, UUID projectId) {

        AiConversation conversation =
                AiConversation.builder()
                        .userId(userId)
                        .title(title != null ? title : "New Chat")
                        .documentId(documentId)
                        .projectId(projectId)
                        .modelName("groq:" + model)
                        .build();

        return conversationRepository.save(conversation);
    }

    @Override
    public List<AiConversation> getUserConversations(
            UUID userId
    ) {

        return conversationRepository
                .findByUserIdAndProjectIdIsNullOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<AiConversation> getUserConversations(UUID userId, UUID projectId) {
        if (projectId == null) {
            return getUserConversations(userId);
        }

        return conversationRepository
                .findByUserIdAndProjectIdOrderByCreatedAtDesc(userId, projectId);
    }

    @Override
    public AiConversation getConversation(UUID id, UUID userId) {
        AiConversation conversation = conversationRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Conversation not found"
                        ));
        if (!conversation.getUserId().equals(userId)) {
            throw new RuntimeException("You do not have permission to access this conversation");
        }
        return conversation;
    }

    @Override
    public void deleteConversation(UUID id, UUID userId) {
        AiConversation conversation = getConversation(id, userId);
        conversationRepository.delete(conversation);
    }

    @Override
    public List<AiMessage> getConversationMessages(UUID conversationId, UUID userId) {
        getConversation(conversationId, userId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }
}
