package com.example.dms.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.messaging.rabbitmq", name = "enabled", havingValue = "true")
class NotificationConsumer {
  private final NotificationRepository repo;

  @RabbitListener(queues = "${app.queue.notifications}")
  void on(NotificationEvent event) {
    repo.save(Notification.builder()
        .tenantId(event.tenantId())
        .type(event.type())
        .title(event.title())
        .message(event.message())
        .readFlag(false)
        .build());
  }
}
