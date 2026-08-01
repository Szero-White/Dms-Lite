package com.example.dms.help;

import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class HelpWorkflowKnowledge {

    private static final String DEFAULT_SCOPE_NOTICE =
        "I only answer workflow questions that match your assigned role and permissions.";

    public HelpAnswerResponse teamAccessAnswer() {
        return response(
            "Owner can create staff accounts and assign roles by job responsibility, so employees only access data required for their work.",
            List.of(
                "Open Team Access.",
                "Choose New Member, then enter username, full name and a temporary password.",
                "Assign the role that matches the employee's job, such as Sales, Warehouse or Accountant.",
                "Create a custom role only when the default system roles do not match the customer's operating model.",
                "Deactivate staff who leave the company instead of deleting their audit trail."
            ),
            List.of("Team Access", "Roles & Permissions", "Audit Logs"),
            List.of(
                "Do not grant OWNER to operating staff.",
                "Review TEAM_MANAGE carefully because it can administer other accounts.",
                "Every staff member should use a separate account."
            )
        );
    }

    public HelpAnswerResponse salesAnswer(HelpPermissionScope scope) {
        List<String> steps = new ArrayList<>();
        steps.add("Check customer status and credit terms before creating a sales order.");
        if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
            steps.add("Open Sales Orders and choose New Order.");
            steps.add("Select customer, products, quantities and warehouse, then review totals before saving.");
        } else {
            steps.add("You can review assigned sales orders, but creating orders requires SALES_ORDER_CREATE.");
        }
        if (scope.has(PermissionNames.SALES_ORDER_CONFIRM)) {
            steps.add("Confirm the order only after customer, stock and price are correct.");
        }
        steps.add("Track the lifecycle: Draft, Confirmed, Completed or Cancelled.");

        return response(
            "Sales workflow keeps orders accurate, stock aligned and receivables clear.",
            steps,
            List.of("Sales Orders", "Customers", "Inventory", "Payments"),
            List.of(
                "Do not confirm an order with missing or incorrect customer/product data.",
                "Cancel incorrect orders through the approved action instead of hiding mistakes."
            )
        );
    }

    public HelpAnswerResponse inventoryAnswer(HelpPermissionScope scope) {
        List<String> steps = new ArrayList<>();
        steps.add("Open Inventory to review stock by SKU and low-stock status.");
        if (scope.has(PermissionNames.INVENTORY_MANAGE)) {
            steps.add("Use receive or adjust stock only when there is a real stock movement or verified correction.");
            steps.add("Add a clear note so the movement can be reviewed later.");
        } else {
            steps.add("Report incorrect stock to Warehouse or Owner because your role cannot adjust inventory.");
        }

        return response(
            "Inventory guidance focuses on keeping stock numbers accurate and traceable.",
            steps,
            List.of("Inventory", "Products", "Sales Orders"),
            List.of(
                "Do not adjust stock without a business reason.",
                "Check SKU and unit before entering large quantities."
            )
        );
    }

    public HelpAnswerResponse financeAnswer(HelpPermissionScope scope) {
        List<String> steps = new ArrayList<>();
        steps.add("Review customer debt before recording a payment.");
        if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            steps.add("Open Payments and record the amount actually received for the correct customer.");
            steps.add("Recheck debt reports after posting the payment.");
        } else {
            steps.add("You may view permitted finance information, but recording payments requires PAYMENT_CREATE.");
        }

        return response(
            "Finance workflow keeps payments and receivables accurate for the business.",
            steps,
            List.of("Payments", "Customers", "Reports"),
            List.of(
                "Do not record a payment before money is received.",
                "Debt and revenue data should only be shared with roles that need it."
            )
        );
    }

    public HelpAnswerResponse productAnswer(HelpPermissionScope scope) {
        List<String> steps = new ArrayList<>();
        steps.add("Use consistent SKU naming so sales and warehouse teams identify products correctly.");
        if (scope.has(PermissionNames.PRODUCT_MANAGE)) {
            steps.add("Open Products to create or update name, SKU, cost, sale price and minimum stock.");
        } else {
            steps.add("If name, price or SKU is wrong, ask someone with PRODUCT_MANAGE to update it.");
        }

        return response(
            "Product catalog is master data for sales and inventory, so changes must be controlled.",
            steps,
            List.of("Products", "Inventory", "Sales Orders"),
            List.of(
                "Avoid duplicate SKU meanings.",
                "Cost and sale price can be sensitive and should only be available to relevant roles."
            )
        );
    }

    public HelpAnswerResponse customerAnswer(HelpPermissionScope scope) {
        List<String> steps = new ArrayList<>();
        steps.add("Search existing customers before creating a new one to avoid duplicates.");
        if (scope.has(PermissionNames.CUSTOMER_MANAGE)) {
            steps.add("Update phone, address, debt limit and credit terms from verified customer information.");
        } else {
            steps.add("If customer data is wrong, send a correction request to a role with CUSTOMER_MANAGE.");
        }

        return response(
            "Customer data helps sales and accounting track orders, limits and receivables correctly.",
            steps,
            List.of("Customers", "Sales Orders", "Payments"),
            List.of(
                "Do not store personal data that is not needed for operations.",
                "Check credit terms before selling on debt."
            )
        );
    }

    public HelpAnswerResponse reportAnswer() {
        return response(
            "Dashboard and Reports are for reviewing revenue, debt, stock and operational performance.",
            List.of(
                "Open Dashboard for a fast business overview.",
                "Use Reports when detailed reconciliation is needed.",
                "If numbers look unusual, compare Sales Orders, Inventory and Payments."
            ),
            List.of("Dashboard", "Reports", "Audit Logs"),
            List.of("Reports may contain sensitive business data and should only be shared with authorized users.")
        );
    }

    public HelpAnswerResponse generalAnswer(HelpPermissionScope scope) {
        return response(
            "I can guide you through the workflows available to your current role.",
            List.of(
                "Ask about a task you need to perform, such as creating an order, checking stock or recording payment.",
                "I will keep the answer inside your assigned permissions.",
                "If a screen is missing from the sidebar, your account probably does not have that permission."
            ),
            scope.visibleModules(),
            List.of("I do not reveal secrets, passwords, tokens or workflow details outside your access scope.")
        );
    }

    public HelpAnswerResponse outOfScopeAnswer(HelpPermissionScope scope, String requestedArea) {
        return response(
            "I cannot help with " + requestedArea + " because it is outside your assigned role or permissions.",
            List.of(
                "Use the modules currently visible to your account.",
                "Ask Owner to review your role if this task is part of your job.",
                "Do not use another employee's account to access restricted workflows."
            ),
            scope.visibleModules(),
            List.of(
                "This boundary protects company data and prevents privilege bypass.",
                "Access changes must be made through Team Access by an authorized Owner."
            ),
            "Requested area blocked: " + requestedArea
        );
    }

    private HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> relatedModules,
        List<String> guardrails
    ) {
        return response(answer, steps, relatedModules, guardrails, DEFAULT_SCOPE_NOTICE);
    }

    private HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> relatedModules,
        List<String> guardrails,
        String scopeNotice
    ) {
        return new HelpAnswerResponse(answer, steps, relatedModules, guardrails, scopeNotice);
    }
}
