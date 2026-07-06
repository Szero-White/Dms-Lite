package com.example.dms.common;
public final class TenantContext {
 private static final ThreadLocal<Long> TENANT=new ThreadLocal<>(); private static final ThreadLocal<Long> USER=new ThreadLocal<>();
 public static void set(Long t,Long u){TENANT.set(t);USER.set(u);} public static Long tenant(){return TENANT.get();} public static Long user(){return USER.get();}
 public static void clear(){TENANT.remove();USER.remove();} public static Long tenantRequired(){ if(TENANT.get()==null) throw new IllegalStateException("Missing tenant"); return TENANT.get();}
 public static Long userOrZero(){return USER.get()==null?0L:USER.get();}
}
