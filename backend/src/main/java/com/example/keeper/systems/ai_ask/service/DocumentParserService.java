package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.extractor.XSLFExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentParserService {

    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;

    @Value("${app.ai.document.chunk-size:1500}")
    private int chunkSize;

    @Value("${app.ai.document.chunk-overlap:200}")
    private int chunkOverlap;

    public boolean parseAndChunkDocument(byte[] fileBytes, String originalFilename, String contentType, UUID documentId) {
        if (fileBytes == null || fileBytes.length == 0) {
            log.warn("Cannot parse empty file content for document: {}", documentId);
            return false;
        }

        String filename = originalFilename;
        if (filename == null || filename.isBlank()) {
            log.warn("Cannot parse document without original filename. DocumentId: {}, contentType: {}",
                    documentId,
                    contentType);
            return false;
        }

        filename = filename.toLowerCase(Locale.ROOT);

        try (InputStream inputStream = new ByteArrayInputStream(fileBytes)) {
            String fullText = "";
            boolean isPdf = filename.endsWith(".pdf");

            if (isPdf) {
                fullText = extractPdfText(inputStream);
            } else if (filename.endsWith(".docx")) {
                fullText = extractDocxText(inputStream);
            } else if (filename.endsWith(".pptx")) {
                fullText = extractPptxText(inputStream);
            } else {
                log.info("Unsupported file type for AI parsing: {}, contentType: {}", filename, contentType);
                return false;
            }

            if (fullText != null && !fullText.isBlank()) {
                chunkAndSaveText(fullText, documentId);
                return true;
            } else {
                if (isPdf) {
                    log.warn("PDFBox extracted blank text for document: {}, filename: {}, contentType: {}. "
                                    + "This PDF is likely scanned/image-only and is unsupported without OCR.",
                            documentId,
                            filename,
                            contentType);
                    return false;
                }
                log.warn("Extracted text is blank for document: {}, filename: {}, contentType: {}",
                        documentId,
                        filename,
                        contentType);
                return false;
            }

        } catch (Exception e) {
            log.error("Failed to parse document for AI Ask. DocumentId: {}, Error: {}", documentId, e.getMessage(), e);
            return false;
        }
    }

    private String extractPdfText(InputStream inputStream) throws Exception {
        try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(
                new org.apache.pdfbox.io.RandomAccessReadBuffer(inputStream))) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        }
    }

    private String extractDocxText(InputStream inputStream) throws Exception {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractPptxText(InputStream inputStream) throws Exception {
        try (XMLSlideShow slideShow = new XMLSlideShow(inputStream);
             XSLFExtractor extractor = new XSLFExtractor(slideShow)) {
            return extractor.getText();
        }
    }

    private void chunkAndSaveText(String fullText, UUID documentId) {
        List<String> chunks = splitIntoChunks(fullText);
        if (chunks.isEmpty()) {
            log.warn("No chunks generated for document {}", documentId);
            return;
        }

        List<float[]> embeddings = embeddingService.embedAll(chunks);
        if (embeddings.size() != chunks.size()) {
            throw new IllegalStateException(
                    "Jina returned " + embeddings.size()
                            + " embeddings for " + chunks.size() + " chunks"
            );
        }

        int chunkIndex = 0;
        List<DocumentChunk> documentChunks = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = new DocumentChunk();

            chunk.setDocumentId(documentId);
            chunk.setChunkIndex(chunkIndex++);
            chunk.setContent(chunks.get(i));
            chunk.setEmbedding(embeddings.get(i));

            documentChunks.add(chunk);
        }

        documentChunkRepository.saveAll(documentChunks);

        log.info("Saved {} chunks for document {}", chunks.size(), documentId);
    }

    private List<String> splitIntoChunks(String fullText) {
        int maxChunkSize = Math.max(1, chunkSize);
        int overlapSize = Math.max(0, Math.min(chunkOverlap, maxChunkSize - 1));
        String[] words = fullText.split("\\s+");

        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();

        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }

            if (!currentChunk.isEmpty()
                    && currentChunk.length() + word.length() + 1 > maxChunkSize) {
                chunks.add(currentChunk.toString().trim());
                currentChunk = buildOverlapChunk(currentChunk.toString(), overlapSize);
            }

            if (!currentChunk.isEmpty()) {
                currentChunk.append(" ");
            }
            currentChunk.append(word);
        }

        if (!currentChunk.isEmpty()) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    private StringBuilder buildOverlapChunk(String chunkText, int overlapSize) {
        if (overlapSize <= 0 || chunkText.isBlank()) {
            return new StringBuilder();
        }

        String[] words = chunkText.trim().split("\\s+");
        StringBuilder overlap = new StringBuilder();

        for (int i = words.length - 1; i >= 0; i--) {
            int nextLength = overlap.length() + words[i].length() + (overlap.isEmpty() ? 0 : 1);
            if (nextLength > overlapSize) {
                break;
            }

            if (overlap.isEmpty()) {
                overlap.insert(0, words[i]);
            } else {
                overlap.insert(0, words[i] + " ");
            }
        }

        return overlap;
    }
}
