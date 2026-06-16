package com.ltz.game_service.dto.response.external;

import java.util.List;

public class ExternalGamePageResponse {

    private List<ExternalGameSearchResponse> items;
    private int page;
    private int size;
    private int totalItems;
    private int totalPages;

    public ExternalGamePageResponse() {
    }

    public ExternalGamePageResponse(
            List<ExternalGameSearchResponse> items,
            int page,
            int size,
            int totalItems,
            int totalPages
    ) {
        this.items = items;
        this.page = page;
        this.size = size;
        this.totalItems = totalItems;
        this.totalPages = totalPages;
    }

    public List<ExternalGameSearchResponse> getItems() {
        return items;
    }

    public void setItems(List<ExternalGameSearchResponse> items) {
        this.items = items;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}