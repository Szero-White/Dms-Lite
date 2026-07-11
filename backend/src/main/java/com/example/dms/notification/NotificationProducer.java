package com.example.dms.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationProducer {
    private final ObjectProvider<RabbitTemplate> rabbitTemplateProvider;

    private final NotificationRepository notificationRepository;

    @Value("${app.queue.notifications}")
    private String queue;

    @Value("${app.messaging.rabbitmq.enabled:false}")
    private boolean rabbitEnabled;

    public void publish(Long tenantId, String type, String title, String message) {
        if (rabbitEnabled) {
            RabbitTemplate rabbit = rabbitTemplateProvider.getIfAvailable();
            if (rabbit != null) {
                try {
                    rabbit.convertAndSend(
                        queue,
                        new NotificationEvent(tenantId, type, title, message)
                    );
                    return;
                } catch (Exception ignored) {
                    // Fallback below keeps local/dev flow usable even if RabbitMQ is down.
                }
            }
        }

        notificationRepository.save(
            Notification.builder()
                .tenantId(tenantId)
                .type(type)
                .title(title)
                .message(message)
                .readFlag(false)
                .build()
        );
    }
}
