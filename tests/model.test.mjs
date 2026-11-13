import test from 'node:test';
import assert from 'node:assert/strict';
import { occurrence, daysUntil, entrySchema } from '../app/model.ts';
const entry = {id:'11111111-1111-4111-8111-111111111111',kind:'birthday',title:'Test birthday',date:'2000-02-29',priority:'normal',completed:false,annual:true,reminder:7,notes:''};
test('annual birthdays roll forward and handle February 29',()=>{
  assert.equal(occurrence(entry,'2026-02-01'),'2026-02-28');
  assert.equal(occurrence(entry,'2026-03-01'),'2027-02-28');
  assert.equal(occurrence(entry,'2028-02-01'),'2028-02-29');
  assert.equal(occurrence({...entry,date:'2000-11-12'},'2026-11-12'),'2026-11-12');
  assert.equal(occurrence({...entry,date:'2000-11-12'},'2026-11-13'),'2027-11-12');
});
test('nonrecurring dates stay fixed and undated tasks are allowed',()=>{
  assert.equal(occurrence({...entry,annual:false},'2026-11-12'),'2000-02-29');
  assert.ok(entrySchema.safeParse({...entry,kind:'task',date:''}).success);
  assert.ok(!entrySchema.safeParse({...entry,date:''}).success);
});
test('invalid dates, blank titles and unsafe reminder values are rejected',()=>{
  for(const change of [{date:'2026-02-30'},{title:'  '},{reminder:-1},{reminder:31},{date:'garbage'}]) assert.ok(!entrySchema.safeParse({...entry,...change}).success);
});
test('reminder day counts do not drift across daylight saving changes',()=>{
  assert.equal(daysUntil('2026-03-09','2026-03-07'),2);
  assert.equal(daysUntil('2027-01-01','2026-12-31'),1);
});
