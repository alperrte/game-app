package com.ltz.game_service.dto.steam;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SteamStoreSearchResponse {

    private List<SteamStoreSearchItem> items;

    public List<SteamStoreSearchItem> getItems() {
        return items;
    }

    public void setItems(List<SteamStoreSearchItem> items) {
        this.items = items;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SteamStoreSearchItem {

        private Integer id;
        private String name;

        @JsonProperty("tiny_image")
        private String tinyImage;

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getTinyImage() {
            return tinyImage;
        }

        public void setTinyImage(String tinyImage) {
            this.tinyImage = tinyImage;
        }
    }
}