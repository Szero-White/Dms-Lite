package com.example.dms.common;
import org.springframework.http.*;import org.springframework.web.bind.*;import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class GlobalExceptionHandler {
 @ExceptionHandler(BusinessException.class) ResponseEntity<ApiResponse<Void>> business(BusinessException e){return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));}
 @ExceptionHandler(Exception.class) ResponseEntity<ApiResponse<Void>> ex(Exception e){return ResponseEntity.status(500).body(ApiResponse.error(e.getMessage()));}
}
