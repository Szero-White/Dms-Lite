package com.example.dms.notification;
public record NotificationEvent(Long tenantId,String type,String title,String message){}
