package com.example.dms.inventory;
import com.example.dms.common.*;import lombok.*;import org.springframework.cache.annotation.CacheEvict;import org.springframework.stereotype.*;import org.springframework.transaction.annotation.Transactional;import java.util.*;
@Service @RequiredArgsConstructor
public class InventoryService {
 private final StockItemRepository stockRepo; private final InventoryTransactionRepository txRepo;
 @Transactional @CacheEvict(value="dashboard",allEntries=true)
 public void increase(Long t,Long w,Long p,int q,String source,Long sourceId,String note){StockItem s=stockRepo.lock(t,w,p).orElseGet(()->stockRepo.save(StockItem.builder().tenantId(t).warehouseId(w).productId(p).quantityOnHand(0).build()));int before=s.getQuantityOnHand();s.setQuantityOnHand(before+q);tx(t,w,p,source,sourceId,"IN",q,before,before+q,note);}
 @Transactional @CacheEvict(value="dashboard",allEntries=true)
 public void deduct(Long t,Long w,Long p,int q,String source,Long sourceId,String note){StockItem s=stockRepo.lock(t,w,p).orElseThrow(()->new BusinessException("Stock not found"));int before=s.getQuantityOnHand();if(before<q)throw new BusinessException("Insufficient stock for product "+p);s.setQuantityOnHand(before-q);tx(t,w,p,source,sourceId,"OUT",q,before,before-q,note);}
 void tx(Long t,Long w,Long p,String source,Long sourceId,String dir,int q,int before,int after,String note){txRepo.save(InventoryTransaction.builder().tenantId(t).warehouseId(w).productId(p).sourceType(source).sourceId(sourceId).direction(dir).quantity(q).beforeQuantity(before).afterQuantity(after).note(note).createdBy(TenantContext.userOrZero()).build());}
 public List<StockItem> stock(){return stockRepo.findByTenantId(TenantContext.tenantRequired());}
 public List<InventoryTransaction> history(){return txRepo.findByTenantIdOrderByCreatedAtDesc(TenantContext.tenantRequired());}
}
