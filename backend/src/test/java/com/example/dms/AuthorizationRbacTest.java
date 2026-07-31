package com.example.dms;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

@SpringBootTest
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
                    "paidAmount", 0,
                    "items", new Object[] {
                        Map.of("productId", 1, "quantity", 1, "discountAmount", 0)
                    }
                ))))
            .andExpect(status().isForbidden());
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

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}