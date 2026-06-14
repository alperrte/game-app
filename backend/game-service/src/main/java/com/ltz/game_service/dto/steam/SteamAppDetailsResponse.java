package com.ltz.game_service.dto.steam;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SteamAppDetailsResponse {

    private boolean success;
    private SteamGameData data;

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public SteamGameData getData() {
        return data;
    }

    public void setData(SteamGameData data) {
        this.data = data;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SteamGameData {

        private String type;
        private String name;

        @JsonProperty("steam_appid")
        private Integer steamAppId;

        @JsonProperty("short_description")
        private String shortDescription;

        @JsonProperty("detailed_description")
        private String detailedDescription;

        @JsonProperty("header_image")
        private String headerImage;

        private List<String> developers;
        private List<String> publishers;
        private List<SteamGenre> genres;
        private SteamPlatforms platforms;

        @JsonProperty("release_date")
        private SteamReleaseDate releaseDate;

        @JsonProperty("pc_requirements")
        private SteamPcRequirements pcRequirements;

        @JsonProperty("supported_languages")
        private String supportedLanguages;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getSteamAppId() {
            return steamAppId;
        }

        public void setSteamAppId(Integer steamAppId) {
            this.steamAppId = steamAppId;
        }

        public String getShortDescription() {
            return shortDescription;
        }

        public void setShortDescription(String shortDescription) {
            this.shortDescription = shortDescription;
        }

        public String getDetailedDescription() {
            return detailedDescription;
        }

        public void setDetailedDescription(String detailedDescription) {
            this.detailedDescription = detailedDescription;
        }

        public String getHeaderImage() {
            return headerImage;
        }

        public void setHeaderImage(String headerImage) {
            this.headerImage = headerImage;
        }

        public List<String> getDevelopers() {
            return developers;
        }

        public void setDevelopers(List<String> developers) {
            this.developers = developers;
        }

        public List<String> getPublishers() {
            return publishers;
        }

        public void setPublishers(List<String> publishers) {
            this.publishers = publishers;
        }

        public List<SteamGenre> getGenres() {
            return genres;
        }

        public void setGenres(List<SteamGenre> genres) {
            this.genres = genres;
        }

        public SteamPlatforms getPlatforms() {
            return platforms;
        }

        public void setPlatforms(SteamPlatforms platforms) {
            this.platforms = platforms;
        }

        public SteamReleaseDate getReleaseDate() {
            return releaseDate;
        }

        public void setReleaseDate(SteamReleaseDate releaseDate) {
            this.releaseDate = releaseDate;
        }

        public SteamPcRequirements getPcRequirements() {
            return pcRequirements;
        }

        public void setPcRequirements(SteamPcRequirements pcRequirements) {
            this.pcRequirements = pcRequirements;
        }

        public String getSupportedLanguages() {
            return supportedLanguages;
        }

        public void setSupportedLanguages(String supportedLanguages) {
            this.supportedLanguages = supportedLanguages;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SteamGenre {

        private String description;

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SteamPlatforms {

        private boolean windows;
        private boolean mac;
        private boolean linux;

        public boolean isWindows() {
            return windows;
        }

        public void setWindows(boolean windows) {
            this.windows = windows;
        }

        public boolean isMac() {
            return mac;
        }

        public void setMac(boolean mac) {
            this.mac = mac;
        }

        public boolean isLinux() {
            return linux;
        }

        public void setLinux(boolean linux) {
            this.linux = linux;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SteamReleaseDate {

        @JsonProperty("coming_soon")
        private boolean comingSoon;

        private String date;

        public boolean isComingSoon() {
            return comingSoon;
        }

        public void setComingSoon(boolean comingSoon) {
            this.comingSoon = comingSoon;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SteamPcRequirements {

        private String minimum;
        private String recommended;

        public String getMinimum() {
            return minimum;
        }

        public void setMinimum(String minimum) {
            this.minimum = minimum;
        }

        public String getRecommended() {
            return recommended;
        }

        public void setRecommended(String recommended) {
            this.recommended = recommended;
        }
    }
}