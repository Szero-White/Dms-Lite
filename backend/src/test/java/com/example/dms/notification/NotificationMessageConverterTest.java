package com.example.dms.notification;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;

class NotificationMessageConverterTest {

    @Test
    void notificationEventRoundTripsAsJson() {
        Jackson2JsonMessageConverter converter =
            new Jackson2JsonMessageConverter("com.example.dms.notification");
        NotificationEvent event = new NotificationEvent(
            1L,
            "SALES_ORDER_CONFIRMED",
            "Order confirmed",
            "Order SO-100 has been confirmed"
        );

        var message = converter.toMessage(event, new MessageProperties());

        assertThat(message.getMessageProperties().getContentType())
            .isEqualTo(MessageProperties.CONTENT_TYPE_JSON);
        assertThat(new String(message.getBody(), UTF_8))
            .contains("\"tenantId\":1")
            .contains("\"type\":\"SALES_ORDER_CONFIRMED\"");
        assertThat(converter.fromMessage(message)).isEqualTo(event);
    }
}
