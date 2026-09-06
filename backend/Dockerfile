FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache font-dejavu
WORKDIR /app
COPY --from=build /app/target/dms-lite-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
