package com.example.dms.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.messaging.rabbitmq", name = "enabled", havingValue = "true")
class NotificationConsumer {

    private final NotificationPersistenceService notificationPersistenceService;

    @RabbitListener(queues = "${app.queue.notifications}")
    void on(NotificationEvent event) {
        notificationPersistenceService.store(event);
    }
}
