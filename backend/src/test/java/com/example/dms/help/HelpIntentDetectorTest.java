package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class HelpIntentDetectorTest {

    private final HelpIntentDetector detector = new HelpIntentDetector();

    @Test
    void detectsSystemTestingQuestions() {
        HelpIntentMatch match = detector.detect(new HelpAskRequest(
            "đầu tiên tôi nên làm gì để test toàn bộ hệ thống",
            "vi",
            List.of()
        ));

        assertThat(match.intent()).isEqualTo(HelpIntent.TESTING);
        assertThat(match.needsClarification()).isFalse();
    }

    @Test
    void usesConversationContextForFollowUpQuestions() {
        HelpIntentMatch match = detector.detect(new HelpAskRequest(
            "chi tiết hơn đi",
            "vi",
            List.of(
                new HelpAskRequest.ConversationTurn("user", "Tôi muốn test toàn bộ hệ thống"),
                new HelpAskRequest.ConversationTurn("assistant", "Để test toàn bộ hệ thống, hãy đi theo luồng vận hành thật.")
            )
        ));

        assertThat(match.intent()).isEqualTo(HelpIntent.TESTING);
        assertThat(match.needsClarification()).isFalse();
    }

    @Test
    void asksForClarificationWhenQuestionIsTooVague() {
        HelpIntentMatch match = detector.detect(new HelpAskRequest("cái này làm sao", "vi", List.of()));

        assertThat(match.intent()).isEqualTo(HelpIntent.UNKNOWN);
        assertThat(match.needsClarification()).isTrue();
    }

    @Test
    void detectsMissingSidebarScreenQuestions() {
        HelpIntentMatch match = detector.detect(new HelpAskRequest(
            "sao tôi không thấy màn hình thanh toán trong sidebar",
            "vi",
            List.of()
        ));

        assertThat(match.intent()).isEqualTo(HelpIntent.MISSING_SCREEN);
        assertThat(match.needsClarification()).isFalse();
    }
}
