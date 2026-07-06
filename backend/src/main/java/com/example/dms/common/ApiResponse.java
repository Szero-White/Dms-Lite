package com.example.dms.common;
import java.time.Instant;
public record ApiResponse<T>(boolean success, String message, T data, Instant timestamp) {
  public static <T> ApiResponse<T> ok(T data){ return new ApiResponse<>(true,"OK",data,Instant.now()); }
  public static <T> ApiResponse<T> ok(String msg,T data){ return new ApiResponse<>(true,msg,data,Instant.now()); }
  public static ApiResponse<Void> error(String msg){ return new ApiResponse<>(false,msg,null,Instant.now()); }
}
