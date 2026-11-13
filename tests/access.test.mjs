import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { accessIssuer, identityRequest, localDevelopmentIdentity, verifyAccessIdentity } from '../lib/access.ts';

const config = { ACCESS_TEAM_DOMAIN: 'https://daykeeper-test.cloudflareaccess.com', ACCESS_AUD: 'test-app-audience' };
const { privateKey, publicKey } = await generateKeyPair('RS256');
async function token(changes = {}) {
  return new SignJWT({ email: 'owner@example.test', ...changes })
    .setProtectedHeader({ alg: 'RS256' }).setIssuer(config.ACCESS_TEAM_DOMAIN)
    .setAudience(config.ACCESS_AUD).setSubject('owner-id').setIssuedAt()
    .setExpirationTime('5m').sign(privateKey);
}
const key = async () => publicKey;
test('valid Access identity comes from a verified token', async () => {
  assert.deepEqual(await verifyAccessIdentity(await token(), config, key), { userId: 'access:owner-id', email: 'owner@example.test' });
});
test('missing, forged, expired, wrong-issuer and wrong-audience tokens are rejected', async () => {
  const valid = await token();
  assert.equal(await verifyAccessIdentity(null, config, key), null);
  assert.equal(await verifyAccessIdentity(valid.slice(0,-10)+'aaaaaaaaaa', config, key), null);
  assert.equal(await verifyAccessIdentity(valid, {...config,ACCESS_AUD:'different-app'},key),null);
  assert.equal(await verifyAccessIdentity(valid, {...config,ACCESS_TEAM_DOMAIN:'https://different.cloudflareaccess.com'},key),null);
  const expired = await new SignJWT({email:'owner@example.test'}).setProtectedHeader({alg:'RS256'})
    .setSubject('owner-id').setIssuer(config.ACCESS_TEAM_DOMAIN).setAudience(config.ACCESS_AUD)
    .setIssuedAt().setExpirationTime(Math.floor(Date.now()/1000)-60).sign(privateKey);
  assert.equal(await verifyAccessIdentity(expired,config,key),null);
  assert.equal(await verifyAccessIdentity(await token({email:null}),config,key),null);
});
test('no unconfigured issuer or untrusted key URL can grant access', async () => {
  for (const domain of ['https://evil.example','http://daykeeper-test.cloudflareaccess.com','https://user@daykeeper-test.cloudflareaccess.com','https://daykeeper-test.cloudflareaccess.com/path','https://daykeeper-test.cloudflareaccess.com:8443']) {
    assert.equal(accessIssuer({...config,ACCESS_TEAM_DOMAIN:domain}),null);
  }
  assert.equal(await verifyAccessIdentity(await token(),{},key),null);
});
test('caller identity headers are replaced, including Sites headers', () => {
  const request = new Request('https://daykeeper.example/api/entries',{headers:{'x-daykeeper-user-id':'attacker','x-daykeeper-user-email':'attacker@example.test','oai-authenticated-user-id':'forged-sites-id'}});
  const forwarded = identityRequest(request,{userId:'access:real',email:'real@example.test'});
  assert.equal(forwarded.headers.get('x-daykeeper-user-id'),'access:real');
  assert.equal(forwarded.headers.get('x-daykeeper-user-email'),'real@example.test');
  assert.equal(forwarded.headers.get('oai-authenticated-user-id'),null);
});
test('development identity requires explicit opt-in and loopback, and is impossible in production', () => {
  const request=new Request('http://127.0.0.1:5173/');
  assert.ok(localDevelopmentIdentity(request,{DAYKEEPER_DEV_AUTH:'1'},true));
  assert.equal(localDevelopmentIdentity(request,{DAYKEEPER_DEV_AUTH:'1'},false),null);
  assert.equal(localDevelopmentIdentity(request,{},true),null);
  assert.equal(localDevelopmentIdentity(new Request('https://daykeeper.example/'),{DAYKEEPER_DEV_AUTH:'1'},true),null);
});
