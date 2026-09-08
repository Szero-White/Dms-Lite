package com.example.dms.notification;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
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

    /**
     * NotificationEvent is a regular Java record, not a Serializable payload.
     * Spring AMQP otherwise falls back to SimpleMessageConverter, which is not
     * suitable for this object contract. A JSON converter keeps producer and
     * @RabbitListener on the same explicit wire format.
     */
    @Bean
    MessageConverter notificationMessageConverter() {
        return new Jackson2JsonMessageConverter("com.example.dms.notification");
    }
}
