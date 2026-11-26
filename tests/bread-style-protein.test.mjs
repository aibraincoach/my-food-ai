import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceProteinMismatch} from '../src/lib/fdc/protein-reference.ts';
for(const [name,description]of [['red bean bun','Roll, white, hamburger bun'],['red bean bun','Rolls, hot dog'],['plain bun','Hamburger bun'],['hot dog bun','Roll, hot dog'],['red bean bun','Rolls, hamburger or hotdog, plain']])test(`bread is not implied meat: ${name} / ${description}`,()=>assert.equal(referenceProteinMismatch(name,description),false));
for(const [name,description]of [['chicken burger','Hamburger, on bun'],['veggie burger','Hamburger, single patty'],['tuna sandwich','Hot dog, beef, on bun'],['squid nigiri','Sushi, topped with tuna']])test(`real protein is kept: ${name} / ${description}`,()=>assert.equal(referenceProteinMismatch(name,description),true));
for(const [name,description]of [['bacon cheeseburger','beef patty'],['imitation crab','Fish, surimi']])test(`existing agreement: ${name} / ${description}`,()=>assert.equal(referenceProteinMismatch(name,description),false));
