package com.ltz.content_service.service.scheduler;

import com.ltz.content_service.entity.NewsArticle;
import com.ltz.content_service.enums.NewsCategory;
import com.ltz.content_service.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NewsScheduler {

    private final NewsArticleRepository newsArticleRepository;
    private final WebClient webClient;

    private static final List<String> HARDWARE_KEYWORDS = Arrays.asList(
            "nvidia", "amd", "intel", "rtx", "gpu", "cpu", "processor", "radeon", "graphics", "dlss", "fsr",
            "ekran kartı", "işlemci", "donanım", "ekran karti", "islemci", "anakart", "ram", "bellek");

    private static final List<String> PATCH_NOTES_KEYWORDS = Arrays.asList(
            "patch notes", "update", "hotfix", "patch v", "version", "changelog", "patch-notes",
            "güncelleme", "yama", "guncelleme", "sürüm", "surum", "notları", "notlari");

    private static final Map<String, String> RSS_SOURCES = Map.of(
            "PC Gamer", "https://www.pcgamer.com/rss/",
            "IGN", "http://feeds.feedburner.com/ign/news",
            "GameSpot", "https://www.gamespot.com/feeds/news/",
            "Eurogamer", "https://www.eurogamer.net/feed/news",
            "Oyungezer", "https://oyungezer.com.tr/rss",
            "Merlin'in Kazani", "https://www.merlininkazani.com/feed/");

    @Scheduled(cron = "0 0 * * * *")
    @CacheEvict(value = "news", allEntries = true)
    public void fetchNews() {
        log.info("Starting news fetch job for multiple RSS sources...");
        RSS_SOURCES.forEach((sourceName, url) -> {
            try {
                fetchFromRss(url, sourceName);
            } catch (Exception e) {
                log.error("Failed to run RSS fetch job for source: {} from URL: {}. Error: ", sourceName, url, e);
            }
        });
    }

    private void fetchFromRss(String url, String sourceName) {
        String xmlContent = null;
        try {
            xmlContent = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (xmlContent == null || xmlContent.isEmpty()) {
                log.warn("Empty RSS response from {}", url);
                return;
            }

            xmlContent = xmlContent.replaceAll("&(?!(amp|lt|gt|quot|apos|#\\d+);)", "&amp;");

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xmlContent.getBytes(StandardCharsets.UTF_8)));

            NodeList items = doc.getElementsByTagName("item");
            for (int i = 0; i < Math.min(items.getLength(), 10); i++) {
                Element item = (Element) items.item(i);
                String title = cleanHtml(getTagValue(item, "title"));
                String description = cleanHtml(getTagValue(item, "description"));
                String link = getTagValue(item, "link");
                LocalDateTime publishedAt = parsePubDate(getTagValue(item, "pubDate"));

                if (link == null || newsArticleRepository.existsByContentUrl(link)) {
                    continue;
                }

                if (description != null) {
                    if (description.length() > 500) {
                        description = description.substring(0, 497) + "...";
                    }
                }

                NewsCategory category = NewsCategory.GLOBAL;
                String lowerTitle = title != null ? title.toLowerCase() : "";
                String lowerDesc = description != null ? description.toLowerCase() : "";

                boolean isHardware = false;
                for (String keyword : HARDWARE_KEYWORDS) {
                    if (lowerTitle.contains(keyword) || lowerDesc.contains(keyword)) {
                        category = NewsCategory.HARDWARE;
                        isHardware = true;
                        break;
                    }
                }

                if (!isHardware) {
                    for (String keyword : PATCH_NOTES_KEYWORDS) {
                        if (lowerTitle.contains(keyword) || lowerDesc.contains(keyword)) {
                            category = NewsCategory.PATCH_NOTES;
                            break;
                        }
                    }
                }

                NewsArticle article = NewsArticle.builder()
                        .title(title)
                        .summary(description)
                        .contentUrl(link)
                        .sourceName(sourceName)
                        .category(category)
                        .createdAt(LocalDateTime.now())
                        .publishedAt(publishedAt)
                        .build();

                newsArticleRepository.save(article);
                log.info("Saved new article from {}: {}", sourceName, title);
            }
        } catch (Exception e) {
            log.warn("Strict XML parsing failed for source {} ({}), falling back to regex parser: {}", sourceName, url,
                    e.getMessage());
            if (xmlContent != null) {
                parseRssViaRegex(xmlContent, sourceName);
            }
        }
    }

    private void parseRssViaRegex(String xmlContent, String sourceName) {
        log.info("Starting robust regex parsing for source: {}", sourceName);
        try {
            java.util.regex.Pattern itemPattern = java.util.regex.Pattern.compile("<item>(.*?)</item>",
                    java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher itemMatcher = itemPattern.matcher(xmlContent);

            int count = 0;
            while (itemMatcher.find() && count < 10) {
                String itemContent = itemMatcher.group(1);

                String title = extractTagContent(itemContent, "title");
                String description = extractTagContent(itemContent, "description");
                if (description == null || description.isEmpty()) {
                    description = extractTagContent(itemContent, "content:encoded");
                }
                String link = extractTagContent(itemContent, "link");

                if (link == null || link.isEmpty()) {
                    link = extractTagContent(itemContent, "guid");
                }

                LocalDateTime publishedAt = parsePubDate(extractTagContent(itemContent, "pubDate"));

                title = cleanHtml(title);
                description = cleanHtml(description);

                if (link == null || link.isEmpty() || newsArticleRepository.existsByContentUrl(link)) {
                    continue;
                }

                if (description != null) {
                    if (description.length() > 500) {
                        description = description.substring(0, 497) + "...";
                    }
                }

                NewsCategory category = NewsCategory.GLOBAL;
                String lowerTitle = title != null ? title.toLowerCase() : "";
                String lowerDesc = description != null ? description.toLowerCase() : "";

                boolean isHardware = false;
                for (String keyword : HARDWARE_KEYWORDS) {
                    if (lowerTitle.contains(keyword) || lowerDesc.contains(keyword)) {
                        category = NewsCategory.HARDWARE;
                        isHardware = true;
                        break;
                    }
                }

                if (!isHardware) {
                    for (String keyword : PATCH_NOTES_KEYWORDS) {
                        if (lowerTitle.contains(keyword) || lowerDesc.contains(keyword)) {
                            category = NewsCategory.PATCH_NOTES;
                            break;
                        }
                    }
                }

                NewsArticle article = NewsArticle.builder()
                        .title(title)
                        .summary(description)
                        .contentUrl(link)
                        .sourceName(sourceName)
                        .category(category)
                        .createdAt(LocalDateTime.now())
                        .publishedAt(publishedAt)
                        .build();

                newsArticleRepository.save(article);
                log.info("Saved new article via regex parser from {}: {}", sourceName, title);
                count++;
            }
        } catch (Exception ex) {
            log.error("Regex parsing also failed for source {}: ", sourceName, ex);
        }
    }

    private String extractTagContent(String content, String tag) {
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("<" + tag + ">(.*?)</" + tag + ">",
                    java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = p.matcher(content);
            if (m.find()) {
                String val = m.group(1).trim();
                // Strip CDATA wrapper if present
                if (val.startsWith("<![CDATA[")) {
                    val = val.substring(9);
                    if (val.endsWith("]]>")) {
                        val = val.substring(0, val.length() - 3);
                    }
                }
                return val.trim();
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    private String cleanHtml(String text) {
        if (text == null) {
            return null;
        }
        // Remove HTML tags
        String cleaned = text.replaceAll("<[^>]*>", "").trim();
        // Replace common HTML entities for clean output
        cleaned = cleaned.replace("&amp;", "&")
                .replace("&#039;", "'")
                .replace("&apos;", "'")
                .replace("&quot;", "\"")
                .replace("&ldquo;", "\"")
                .replace("&rdquo;", "\"")
                .replace("&lsquo;", "'")
                .replace("&rsquo;", "'")
                .replace("&ndash;", "–")
                .replace("&mdash;", "—")
                .replace("&nbsp;", " ");
        return cleaned;
    }

    private static final DateTimeFormatter LOCAL_PUB_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private LocalDateTime parsePubDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        try {
            return ZonedDateTime.parse(trimmed, DateTimeFormatter.RFC_1123_DATE_TIME).toLocalDateTime();
        } catch (Exception rfcEx) {
            try {
                return LocalDateTime.parse(trimmed, LOCAL_PUB_DATE_FORMAT);
            } catch (Exception localEx) {
                log.warn("Failed to parse RSS pubDate '{}': {}", trimmed, rfcEx.getMessage());
                return null;
            }
        }
    }

    private String getTagValue(Element element, String tagName) {
        NodeList list = element.getElementsByTagName(tagName);
        if (list != null && list.getLength() > 0) {
            return list.item(0).getTextContent();
        }
        return null;
    }
}
