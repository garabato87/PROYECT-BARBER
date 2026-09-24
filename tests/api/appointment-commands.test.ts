/* eslint-disable */
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mock = vi.hoisted(() => {
  const data = new Map<string, Record<string, unknown>>();
  const writes: string[] = [];
  // col() returns a queryable collection object with .doc() and chainable .where().
  function buildCol(colPath: string): { doc: (id: string) => ReturnType<typeof buildRef>; where: (...args: unknown[]) => ReturnType<typeof buildCol> } {
    const c: { doc: (id: string) => ReturnType<typeof buildRef>; where: (...args: unknown[]) => typeof c } = {
      doc: (id: string) => buildRef(`${colPath}/${id}`),
      where: (..._: unknown[]) => c,
    };
    return c;
  }
  function buildRef(path: string): { path: string; collection: (name: string) => ReturnType<typeof buildCol>; get: () => Promise<unknown> } {
    return { path, collection: (name: string) => buildCol(`${path}/${name}`), get: async () => ({ exists: data.has(path), data: () => data.get(path) }) };
  }
  // get() handles both DocumentReferences (has .path) and Query objects (no .path → availability scan).
  const get = vi.fn(async (r: { path?: string }) => {
    if (r && typeof (r as { path?: string }).path === 'string') {
      const p = (r as { path: string }).path;
      return { exists: data.has(p), data: () => data.get(p) };
    }
    // Query: return active availability docs so the interval overlap check works in unit tests.
    const docs = [...data.entries()]
      .filter(([k, v]) => k.includes('/availability/') && typeof v === 'object' && v !== null && ['pending', 'confirmed'].includes((v as Record<string, unknown>).status as string))
      .map(([, v]) => ({ data: () => v as Record<string, unknown> }));
    return { docs, empty: docs.length === 0, size: docs.length };
  });
  const runTransaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    const pending: Array<() => void> = [];
    const result = await fn({ get, set: (r: {path:string}, value: Record<string,unknown>) => pending.push(() => {data.set(r.path,value);writes.push(r.path);}), update: (r: {path:string}, value: Record<string,unknown>) => pending.push(() => {data.set(r.path,{...data.get(r.path),...value});writes.push(r.path);}) });
    pending.forEach(commit => commit());
    return result;
  });
  return {data, writes, get, runTransaction, collection: vi.fn((name: string) => buildCol(name)), verifyIdToken: vi.fn(), getUser: vi.fn()};
});
vi.mock('../../api/_lib/firebase-admin.js',()=>({db:mock,auth:mock}));
import create from '../../api/create-appointment.js';
import update from '../../api/update-appointment.js';

// Stable requestId for all tests; appointmentId is deterministic from it.
const REQUEST_ID = 'test-req-stable-001';
const appointmentId = createHash('sha256').update(`shop:${REQUEST_ID}`).digest('hex').slice(0, 28);
const body = {barbershopId:'shop',professionalId:'pro',serviceId:'service',date:'2030-09-24',startTime:'10:00',requestId:REQUEST_ID};
const appPath = `businesses/shop/appointments/${appointmentId}`;
const statusBody = {barbershopId:'shop',appointmentId,status:'cancelled'};
async function call(handler: typeof create, payload: unknown, authorization: unknown = 'Bearer valid',method='POST') {
  const res={status:vi.fn(),json:vi.fn(),setHeader:vi.fn()};res.status.mockReturnValue(res);
  await handler({method,headers:{authorization},body:payload} as VercelRequest,res as unknown as VercelResponse);
  return {code:res.status.mock.calls[0]?.[0],body:res.json.mock.calls[0]?.[0]};
}
beforeEach(()=>{
  vi.clearAllMocks();mock.data.clear();mock.writes.length=0;
  vi.stubEnv('NOTIFICATIONS_MODE','off');
  mock.verifyIdToken.mockResolvedValue({uid:'client',email:'stale@example.test',email_verified:true});
  mock.getUser.mockResolvedValue({uid:'client',email:'trusted@example.test',emailVerified:true,disabled:false});
  mock.data.set('users/client',{role:'client',name:'Trusted',phone:'12345678'});
  mock.data.set('businesses/shop',{name:'Shop',status:'active'});
  mock.data.set('businesses/shop/services/service',{name:'Haircut',duration:30,price:100});
  mock.data.set('businesses/shop/professionals/pro',{name:'Pro',isActive:true});
});
describe('authenticated appointment commands',()=>{
  it('rejects manual appointment with empty required phone', async () => {
    // phone tiene required=true en la validación: cadena vacía es rechazada correctamente
    mock.data.set('users/client', { role: 'admin', barbershopId: 'shop' });
    expect((await call(create, { ...body, manualContact: { name: 'Walk-in', phone: '' } })).code).toBe(400);
  });
  it('allows manual appointment with non-empty phone', async () => {
    mock.data.set('users/client', { role: 'admin', barbershopId: 'shop' });
    expect((await call(create, { ...body, manualContact: { name: 'Walk-in', phone: '1234' } })).code).toBe(200);
    expect(mock.data.get(appPath)?.clientPhone).toBe('1234');
  });
  it('rejects staff booking without manualContact (client-only direct booking route)', async () => {
    // La ruta de booking directo sin manualContact es solo para rol 'client'.
    mock.data.set('users/client', { role: 'admin', barbershopId: 'shop', name: 'Admin' });
    expect((await call(create, body)).code).toBe(403);
  });
  it('allows client self-booking and self-cancellation', async () => {
    expect((await call(create, body)).code).toBe(200);
    expect(mock.data.get(appPath)?.clientId).toBe('client');
    expect((await call(update, statusBody)).code).toBe(200);
  });
  it.each(['admin'])('in-shop %s can create manual booking and confirm', async role => {
    // El profesional no puede crear manual booking porque staff() exige uid===professionalId.
    // Solo admin y super-admin del shop pueden crear manuals con cualquier professionalId.
    mock.data.set('users/client', { role, barbershopId: 'shop' });
    expect((await call(create, { ...body, manualContact: { name: 'Manual', phone: '123' } })).code).toBe(200);
    expect((await call(update, { ...statusBody, status: 'confirmed' })).code).toBe(200);
  });
  it('professional can create manual only for own professionalId slot', async () => {
    // El profesional 'client' puede crear manual booking solo cuando coincide uid===professionalId
    mock.data.set('users/client', { role: 'professional', barbershopId: 'shop' });
    // body usa professionalId:'pro', uid es 'client' → falla porque 'client' !== 'pro'
    expect((await call(create, { ...body, manualContact: { name: 'Manual', phone: '123' } })).code).toBe(403);
  });
  it.each(['admin', 'professional'])('self booking does not permit cross-shop %s confirmation', async role => {
    mock.data.set('users/client', { role, barbershopId: 'other' });
    mock.data.set(appPath, { clientId: 'client', professionalId: 'pro', status: 'pending' });
    expect((await call(update, { ...statusBody, status: 'confirmed' })).code).toBe(403);
  });
  it.each([create,update])('rejects invalid token before business reads',async handler=>{
    mock.verifyIdToken.mockRejectedValueOnce(new Error('secret token'));
    expect((await call(handler,body)).code).toBe(401);expect(mock.collection).not.toHaveBeenCalled();
  });
  it.each([undefined,'Bearer ',['Bearer valid'],'Basic token'])('rejects malformed auth %s',async header=>{
    expect((await call(create,body,header ?? null)).code).toBe(401);expect(mock.collection).not.toHaveBeenCalled();
  });
  it.each(['clientEmail','clientId','endTime','shopName','price','role'])('rejects forged %s',async key=>{
    expect((await call(create,{...body,[key]:'forged'})).code).toBe(400);expect(mock.writes).toEqual([]);
  });
  it('derives identity, recipient and service fields and minimal public projection',async()=>{
    expect((await call(create,body)).code).toBe(200);
    expect(mock.data.get(appPath)).toMatchObject({clientId:'client',clientName:'Trusted',clientEmail:'trusted@example.test',endTime:'10:30',price:100,duration:30,status:'pending'});
    expect(Object.keys(mock.data.get(appPath.replace('/appointments/','/availability/'))!).sort()).toEqual(['date','endTime','professionalId','startTime','status']);
    expect(mock.writes.filter(p=>p.includes('/outbox/'))).toHaveLength(1);
  });
  it('omits unverified email from event recipient',async()=>{
    mock.getUser.mockResolvedValueOnce({email:'unverified@example.test',emailVerified:false});await call(create,body);
    const event=mock.data.get(mock.writes.find(p=>p.includes('/outbox/'))!)!;
    expect(event.status).toBe('skipped');expect(JSON.stringify(event)).not.toContain('unverified@example.test');
  });
  it.each(['admin','professional'])('rejects cross-tenant %s manual booking',async role=>{
    mock.data.set('users/client',{role,barbershopId:'other'});
    expect((await call(create,{...body,manualContact:{name:'Manual',phone:'123'}})).code).toBe(403);expect(mock.writes).toEqual([]);
  });
  it('rejects client manual booking',async()=>expect((await call(create,{...body,manualContact:{name:'Manual',phone:'123'}})).code).toBe(403));
  it('rejects professional managing another professional',async()=>{
    mock.data.set('users/client',{role:'professional',barbershopId:'shop'});
    mock.data.set(appPath,{clientId:'someone',professionalId:'pro',status:'pending'});
    expect((await call(update,statusBody)).code).toBe(403);
  });
  it('forbids client confirmation',async()=>{
    mock.data.set(appPath,{clientId:'client',professionalId:'pro',status:'pending'});
    expect((await call(update,{...statusBody,status:'confirmed'})).code).toBe(403);
  });
  it.each(['completed','absent','cancelled'])('cannot reopen terminal %s',async status=>{
    mock.data.set('users/client',{role:'admin',barbershopId:'shop'});mock.data.set(appPath,{status,professionalId:'pro'});
    expect((await call(update,{...statusBody,status:'confirmed'})).code).toBe(409);expect(mock.writes).toEqual([]);
  });
  it('authorizes before accepting repeated state',async()=>{
    mock.data.set(appPath,{clientId:'other',professionalId:'pro',status:'cancelled'});
    expect((await call(update,statusBody)).code).toBe(403);
  });
  it('repeat cancellation has no writes or duplicate event',async()=>{
    mock.data.set(appPath,{clientId:'client',professionalId:'pro',status:'cancelled'});
    expect((await call(update,statusBody)).code).toBe(200);expect(mock.writes).toEqual([]);
  });
  it('reads permissions inside transaction and cancels atomically',async()=>{
    await call(create,body);mock.writes.length=0;await call(update,statusBody);
    expect(mock.get.mock.calls.some(([r])=>r.path==='users/client')).toBe(true);
    expect(mock.data.get(appPath)?.status).toBe('cancelled');expect(mock.writes).toHaveLength(3);
  });
  it.each([create,update])('rejects non POST before auth',async handler=>{
    expect((await call(handler,body,'Bearer valid','GET')).code).toBe(405);expect(mock.verifyIdToken).not.toHaveBeenCalled();
  });
  it('checks token revocation and disabled accounts before database reads',async()=>{
    mock.getUser.mockResolvedValueOnce({disabled:true});expect((await call(create,body)).code).toBe(401);
    expect(mock.verifyIdToken).toHaveBeenCalledWith('valid',true);expect(mock.collection).not.toHaveBeenCalled();
  });
  it.each([null,[],{},'invalid'])('rejects malformed body %s',async payload=>{
    expect((await call(create,payload)).code).toBe(400);expect(mock.writes).toHaveLength(0);
  });
  it.each([{barbershopId:'../other'},{professionalId:''},{date:'2030-02-31'},{date:'no'},{startTime:'24:00'},{startTime:'10:60'}])('rejects malformed identifiers/date/time %s',async invalid=>{
    expect((await call(create,{...body,...invalid})).code).toBe(400);expect(mock.writes).toHaveLength(0);
  });
  it.each([{name:'',phone:'12'},{name:'Ok',phone:'12',role:'admin'},{name:'Ok',phone:'12',email:'a@b;bad'},{name:'Ok\nHeader',phone:'12'}])('rejects invalid manual contact %s',async manualContact=>{
    expect((await call(create,{...body,manualContact})).code).toBe(400);
  });
  it.each(['admin','super-admin'])('scoped %s can create manual and confirm',async role=>{
    mock.data.set('users/client',{role,barbershopId:'shop'});
    expect((await call(create,{...body,manualContact:{name:'Manual',phone:'123',email:'manual@example.test'}})).code).toBe(200);
    expect(mock.data.get(appPath)).toMatchObject({clientId:'',createdBy:'client',clientName:'Manual',contactSource:'manual',clientEmail:'manual@example.test'});
    expect((await call(update,{...statusBody,status:'confirmed'})).code).toBe(200);
    expect(mock.data.get(appPath)?.revision).toBe(2);
  });
  it('professional can create manual for self, then complete pending',async()=>{
    mock.verifyIdToken.mockResolvedValueOnce({uid:'pro'});mock.data.set('users/pro',{role:'professional',barbershopId:'shop'});
    expect((await call(create,{...body,manualContact:{name:'Manual',phone:'123'}})).code).toBe(200);
    mock.verifyIdToken.mockResolvedValueOnce({uid:'pro'});
    expect((await call(update,{...statusBody,status:'completed'})).code).toBe(200);
  });
  it.each(['admin','professional'])('cross-local %s cannot update',async role=>{
    mock.data.set('users/client',{role,barbershopId:'other'});mock.data.set(appPath,{status:'pending',professionalId:'client',clientId:'someone'});
    expect((await call(update,statusBody)).code).toBe(403);
  });
  it.each([undefined,{role:'bad'},{role:'client',disabled:true},{role:'client',status:'suspended'}])('fails closed for missing/disabled/unknown profile %s',async profile=>{
    if(profile) mock.data.set('users/client',profile); else mock.data.delete('users/client');
    expect((await call(create,body)).code).toBe(403);expect(mock.writes).toHaveLength(0);
  });
  it.each(['businesses/shop','businesses/shop/services/service','businesses/shop/professionals/pro'])('requires referenced record %s',async path=>{
    mock.data.delete(path);expect((await call(create,body)).code).toBe(400);
  });
  it('rejects inactive shop',async()=>{mock.data.set('businesses/shop',{status:'inactive'});expect((await call(create,body)).code).toBe(400);});
  it('rejects inactive professional',async()=>{mock.data.set('businesses/shop/professionals/pro',{isActive:false});expect((await call(create,body)).code).toBe(400);});
  it.each([{duration:0,price:100},{duration:30,price:-1},{duration:'30',price:100},{duration:30,price:Infinity},{duration:1500,price:100}])('rejects invalid service %s',async service=>{
    mock.data.set('businesses/shop/services/service',service);expect((await call(create,body)).code).toBe(400);
  });
  it('rejects interval crossing midnight',async()=>expect((await call(create,{...body,startTime:'23:45'})).code).toBe(400));
  it('does not overwrite existing slot',async()=>{await call(create,body);mock.writes.length=0;expect((await call(create,{...body, requestId: 'different-req'})).code).toBe(409);expect(mock.writes).toHaveLength(0);});
  it.each(['pending','invalid',null])('rejects invalid requested status %s',async status=>expect((await call(update,{...statusBody,status})).code).toBe(400));
  it('missing appointment has no writes',async()=>{expect((await call(update,statusBody)).code).toBe(404);expect(mock.writes).toHaveLength(0);});
  it('legacy unknown state cannot transition',async()=>{mock.data.set(appPath,{clientId:'client',status:'legacy'});expect((await call(update,statusBody)).code).toBe(409);});
  it('does not leak database payload in logs or response',async()=>{
    const error=vi.spyOn(console,'error').mockImplementation(()=>{});mock.get.mockRejectedValueOnce(new Error('private@example.test token-secret'));
    const result=await call(create,body);expect(result.code).toBe(500);expect(JSON.stringify([result,error.mock.calls])).not.toMatch(/private@example|token-secret/);error.mockRestore();
  });
});
