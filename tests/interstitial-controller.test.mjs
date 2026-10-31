import assert from "node:assert/strict";
import test from "node:test";
import { InterstitialController, INTERSTITIAL_COOLDOWN_MS } from "../.test-dist/platform/InterstitialController.js";

test("90 second cooldown and retry protection apply only to completed levels", async () => {
  let now = 1000, shown = 0;
  const ctl = new InterstitialController({
    id:"yandex", async showInterstitial(){ shown++; return true; },
  },()=>now);
  assert.equal(await ctl.tryShow(), false);
  now+=INTERSTITIAL_COOLDOWN_MS;
  assert.equal(await ctl.tryShow(), true);
  assert.equal(shown,1);
  now+=1000;
  assert.equal(await ctl.tryShow(), false);
  now+=INTERSTITIAL_COOLDOWN_MS;
  assert.equal(await ctl.tryShow(), true);
});
test("failed and not-shown attempts use short retry cooldown, not 90 seconds", async()=>{
  let now=0,count=0;
  const ctl=new InterstitialController({id:"yandex",async showInterstitial(){count++;return false;}},()=>now);
  now=90000;assert.equal(await ctl.tryShow(),false);
  now=90001;assert.equal(await ctl.tryShow(),false);
  now=105000;assert.equal(await ctl.tryShow(),false);
  assert.equal(count,2);
});
test("standalone web never advertises; concurrent attempts never overlap",async()=>{
  let t=100000,calls=0,finish;
  const web=new InterstitialController({id:"web",async showInterstitial(){calls++;return true;}},()=>t);
  assert.equal(await web.tryShow(),false);
  assert.equal(calls,0);
  const ctl=new InterstitialController({id:"yandex",showInterstitial(){calls++;return new Promise(resolve=>{finish=resolve;});}},()=>0);
  // Inject current time separately: t is immutable for the gate in this test.
  const running=new InterstitialController({id:"yandex",showInterstitial(){calls++;return new Promise(resolve=>{finish=resolve;});}},()=>t);
  t+=90000;
  const one=running.tryShow();
  assert.equal(await running.tryShow(),false);
  finish(true);
  assert.equal(await one,true);
  assert.equal(calls,1);
});


test("open hook runs only when an ad opens, not on cooldown, skipped or no-fill", async () => {
  let time = 1000, opened = 0, calls = 0;
  const ctl = new InterstitialController({
    id: "yandex",
    async showInterstitial(onOpen) {
      calls++;
      if (calls === 1) return false; // SDK did not open an ad.
      onOpen?.();
      return true;
    },
  }, () => time);
  assert.equal(await ctl.tryShow(() => opened++), false); // initial cooldown
  time += 90000;
  assert.equal(await ctl.tryShow(() => opened++), false); // no-fill
  assert.equal(opened, 0);
  time += 15000;
  assert.equal(await ctl.tryShow(() => opened++), true);
  assert.equal(opened, 1);
  assert.equal(calls, 2);
});
