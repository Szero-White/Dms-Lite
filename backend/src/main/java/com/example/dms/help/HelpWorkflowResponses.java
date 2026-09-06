package com.example.dms.help;

import java.util.List;

final class HelpWorkflowResponses {

    static final String EN_SCOPE_NOTICE =
        "I only answer workflow questions that match your assigned role and permissions.";
    static final String VI_SCOPE_NOTICE =
        "Tôi chỉ trả lời các câu hỏi quy trình phù hợp với vai trò và quyền được phân công.";

    private HelpWorkflowResponses() {
    }

    static HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> relatedModules,
        List<String> guardrails,
        HelpLocale locale
    ) {
        return response(answer, steps, relatedModules, guardrails, scopeNotice(locale), false);
    }

    static HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> relatedModules,
        List<String> guardrails,
        String scopeNotice,
        boolean blocked
    ) {
        return new HelpAnswerResponse(
            answer,
            steps,
            relatedModules,
            guardrails,
            scopeNotice,
            blocked,
            HelpAnswerSource.WORKFLOW_KNOWLEDGE,
            HelpGenerationProvider.NONE
        );
    }

    private static String scopeNotice(HelpLocale locale) {
        return locale == HelpLocale.VI ? VI_SCOPE_NOTICE : EN_SCOPE_NOTICE;
    }
}
