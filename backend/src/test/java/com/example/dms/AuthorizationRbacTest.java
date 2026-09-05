package com.example.dms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = "app.demo.enabled=true")
@AutoConfigureMockMvc
class AuthorizationRbacTest {

    private static final String DEMO_PASSWORD = "123456";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void ownerCanReadAuditLogs() throws Exception {
        mvc.perform(get("/api/audit-logs")
                .header("Authorization", bearer("owner")))
            .andExpect(status().isOk());
    }

    @Test
    void salesCannotReadAuditLogs() throws Exception {
        mvc.perform(get("/api/audit-logs")
                .header("Authorization", bearer("sale")))
            .andExpect(status().isForbidden());
    }

    @Test
    void salesCannotReadFinancialReports() throws Exception {
        mvc.perform(get("/api/reports/dashboard")
                .header("Authorization", bearer("sale")))
            .andExpect(status().isForbidden());
    }

    @Test
    void salesCanReadInventoryButCannotReceiveStock() throws Exception {
        mvc.perform(get("/api/inventory/stock")
                .header("Authorization", bearer("sale")))
            .andExpect(status().isOk());

        mvc.perform(post("/api/inventory/receive")
                .header("Authorization", bearer("sale"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "warehouseId", 1,
                    "productId", 1,
                    "quantity", 1,
                    "note", "RBAC test"
                ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void warehouseCanReadOrdersButCannotCreateOrders() throws Exception {
        mvc.perform(get("/api/sales-orders")
                .header("Authorization", bearer("warehouse")))
            .andExpect(status().isOk());

        mvc.perform(post("/api/sales-orders")
                .header("Authorization", bearer("warehouse"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "customerId", 1,
                    "warehouseId", 1,
                    "items", new Object[] {
                        Map.of("productId", 1, "quantity", 1, "discountAmount", 0)
                    }
                ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void warehouseNotificationFeedDoesNotExposeFinanceAlerts() throws Exception {
        MvcResult result = mvc.perform(get("/api/notifications")
                .header("Authorization", bearer("warehouse")))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertThat(data.findValuesAsText("type"))
            .doesNotContain("OVERDUE_DEBT", "PAYMENT_RECORDED");
    }

    @Test
    void salesProductCatalogRedactsCostPriceButOwnerCanSeeIt() throws Exception {
        mvc.perform(get("/api/products")
                .header("Authorization", bearer("sale")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].costPrice").value(org.hamcrest.Matchers.nullValue()));

        mvc.perform(get("/api/products")
                .header("Authorization", bearer("owner")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].costPrice").isNumber());
    }

    @Test
    void permissionCatalogPublishesDependenciesUsedByCustomRoleUi() throws Exception {
        MvcResult result = mvc.perform(get("/api/team/permissions")
                .header("Authorization", bearer("owner")))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode permissions = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        JsonNode inventoryView = findPermission(permissions, "INVENTORY_VIEW");
        JsonNode productManage = findPermission(permissions, "PRODUCT_MANAGE");

        assertThat(toTextList(inventoryView.path("requires")))
            .containsExactly("PRODUCT_VIEW");
        assertThat(toTextList(productManage.path("requires")))
            .containsExactly("PRODUCT_VIEW");
    }

    @Test
    void accountantCanRecordPaymentButCannotManageProducts() throws Exception {
        mvc.perform(post("/api/products")
                .header("Authorization", bearer("accountant"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "name", "RBAC test product",
                    "sku", "RBAC-TEST",
                    "barcode", "",
                    "costPrice", 1000,
                    "sellingPrice", 1200,
                    "minStock", 1
                ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanManageTeamButSalesCannot() throws Exception {
        mvc.perform(get("/api/team/members")
                .header("Authorization", bearer("owner")))
            .andExpect(status().isOk());

        mvc.perform(get("/api/team/members")
                .header("Authorization", bearer("sale")))
            .andExpect(status().isForbidden());
    }

    @Test
    void ownerCannotDeactivateSeededDemoStaff() throws Exception {
        MvcResult membersResult = mvc.perform(get("/api/team/members")
                .header("Authorization", bearer("owner")))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode members = objectMapper.readTree(membersResult.getResponse().getContentAsString()).path("data");
        long salesUserId = 0L;
        for (JsonNode member : members) {
            if ("sale".equals(member.path("username").asText())) {
                salesUserId = member.path("id").asLong();
                break;
            }
        }
        assertThat(salesUserId).isPositive();

        mvc.perform(delete("/api/team/members/{id}", salesUserId)
                .header("Authorization", bearer("owner")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message")
                .value("Demo accounts are protected while demo mode is enabled"));
    }

    @Test
    void salesCanAskHelpAssistant() throws Exception {
        mvc.perform(post("/api/help/ask")
                .header("Authorization", bearer("sale"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "question", "Nhan vien sales moi can lam gi de tao don hang?"
                ))))
            .andExpect(status().isOk());
    }

    @Test
    void salesCannotUseHelpAssistantToLearnTeamAccess() throws Exception {
        mvc.perform(post("/api/help/ask")
                .header("Authorization", bearer("sale"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "question", "Owner cap tai khoan va phan quyen nhan vien ra sao?"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.answer").value(org.hamcrest.Matchers.containsString("Team Access")))
            .andExpect(jsonPath("$.data.blocked").value(true));
    }

    @Test
    void salesCannotReadHelpHistory() throws Exception {
        mvc.perform(get("/api/help/history")
                .header("Authorization", bearer("sale")))
            .andExpect(status().isForbidden());
    }

    @Test
    void ownerCannotCreateCustomRoleWithTeamManagementPermission() throws Exception {
        mvc.perform(post("/api/team/roles")
                .header("Authorization", bearer("owner"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "name", "Branch Admin",
                    "permissions", new String[] { "AI_HELP_VIEW", "TEAM_MANAGE" }
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Team management permission is reserved for Owner accounts"));
    }


    @Test
    void ownerCannotCreatePaymentRoleWithoutCustomerViewDependency() throws Exception {
        mvc.perform(post("/api/team/roles")
                .header("Authorization", bearer("owner"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "name", "Cashier Only",
                    "permissions", new String[] { "PAYMENT_CREATE" }
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("PAYMENT_CREATE requires: CUSTOMER_VIEW"));
    }

    @Test
    void salesCannotCreateOrderForUnknownWarehouse() throws Exception {
        mvc.perform(post("/api/sales-orders")
                .header("Authorization", bearer("sale"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "customerId", 1,
                    "warehouseId", 999999,
                    "items", new Object[] {
                        Map.of("productId", 1, "quantity", 1, "discountAmount", 0)
                    }
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Warehouse not found"));
    }

    @Test
    void helpAssistantRejectsTooManyQuestionsFromSameUser() throws Exception {
        String token = bearer("accountant");

        for (int i = 0; i < 12; i++) {
            mvc.perform(post("/api/help/ask")
                    .header("Authorization", token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of(
                        "question", "How should accountant record payment " + i + "?"
                    ))))
                .andExpect(status().isOk());
        }

        mvc.perform(post("/api/help/ask")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "question", "How should accountant record payment after limit?"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Too many AI questions. Please wait a moment before asking again."));
    }

    private String bearer(String username) throws Exception {
        return "Bearer " + token(username);
    }

    private String token(String username) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "username", username,
                    "password", DEMO_PASSWORD
                ))))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.path("data").path("accessToken").asText();
    }


    private JsonNode findPermission(JsonNode permissions, String name) {
        for (JsonNode permission : permissions) {
            if (name.equals(permission.path("name").asText())) {
                return permission;
            }
        }

        throw new AssertionError("Permission not found: " + name);
    }

    private java.util.List<String> toTextList(JsonNode array) {
        java.util.List<String> values = new java.util.ArrayList<>();
        array.forEach(node -> values.add(node.asText()));
        return values;
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
