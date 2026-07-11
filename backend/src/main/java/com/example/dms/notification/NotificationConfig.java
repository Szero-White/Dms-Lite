package com.example.dms.notification;

import org.springframework.amqp.core.Queue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "app.messaging.rabbitmq", name = "enabled", havingValue = "true")
class NotificationConfig {

    @Bean
    Queue queue(@Value("${app.queue.notifications}") String queueName) {
        return new Queue(queueName, true);
    }
}
