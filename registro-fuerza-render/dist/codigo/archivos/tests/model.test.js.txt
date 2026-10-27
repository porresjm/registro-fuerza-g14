import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,series,lastSet,updateSet,validSet,daysSince} from '../dist/model.js';
test('una corrección recalcula la evolución y la referencia sin tocar otras sesiones',()=>{const original=seed(new Date('2026-10-27T12:00:00Z'));const changed=updateSet(original,'demo-14','s14a',{weight:24,reps:10});assert.equal(series(changed.sessions,'curl').at(-1).weight,24);assert.equal(lastSet(changed.sessions,'curl').weight,24);assert.equal(original.sessions.at(-1).sets[0].weight,12);assert.equal(changed.sessions[0],original.sessions[0]);});
test('el intervalo representa días desde un registro, no una estimación fisiológica',()=>{assert.equal(daysSince('2026-10-13',new Date('2026-10-27T12:00:00Z')),14);});
test('rechaza valores vacíos, no finitos y repeticiones fraccionales',()=>{for(const row of [{weight:'',reps:10},{weight:NaN,reps:10},{weight:12,reps:1.5},{weight:-4,reps:8}])assert.equal(validSet(row),false);assert.equal(validSet({weight:'12.5',reps:'8'}),true);});
