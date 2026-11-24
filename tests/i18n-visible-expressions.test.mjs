import test from'node:test';import assert from'node:assert/strict';import{Linter}from'eslint';import{noFixedMessages}from'../scripts/eslint-i18n.mjs';
const lint=source=>new Linter().verify(source,{languageOptions:{ecmaVersion:2022,sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{messages:{rules:{fixed:noFixedMessages}}},rules:{'messages/fixed':'error'}});
for(const source of[
 "const C=()=> <p>{n===1?'serving':'servings'}</p>;",
 "const C=()=> <p>{count>1?'Photos '+count:'Photo'}</p>;",
 "const C=()=> <p>{message || 'Try again'}</p>;",
])test('nested app text fails: '+source,()=>{assert.ok(lint(source).some(x=>x.ruleId==='messages/fixed'));});
test('translation calls, data, units, CSS props and punctuation remain valid',()=>{
 assert.deepEqual(lint("const C=()=> <p className={active?'text-white':'text-muted'}>{t('servingAmount',{count})}{name}{mode==='photo'&&t('camera')}{' · '}{'kcal'}</p>;"),[]);
});
