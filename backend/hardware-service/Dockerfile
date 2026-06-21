# -----------------------------
# 1️⃣ Build Stage
# -----------------------------
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Dependency cache
COPY pom.xml .
RUN mvn dependency:go-offline

# Source code
COPY src ./src

RUN mvn clean package -DskipTests

# -----------------------------
# 2️⃣ Runtime Stage
# -----------------------------
FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]