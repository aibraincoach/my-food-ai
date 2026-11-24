// Enforced on converted directories only; each slice expands the scope.
// All remaining src directories are temporary migration exemptions, removed
// at slice 6. Do not add a converted directory back to the exemptions.
// #1243/#1253 owner wording holds. Delete this one entry after the owner rules.
export const HELD_FOR_OWNER_WORDING = [
 // unavailableSentence templates remain untouched in their existing reader.
 'The model did not treat “{food}” as a food, so no nutrition was estimated.',
 'No USDA record matched “{food}” and the model gave no usable estimate.',
 'No USDA record matched “{food}”.',
];
export const untranslatedNamesAndUnits = ['My Food AI','kcal','g','ml','mg','(',')'];
export const deferred = [
 'src/app/**','!src/app/admin/freeze-reports/**','!src/app/(auth)/**','!src/app/error.tsx','!src/app/not-found.tsx','!src/app/(tabs)/profile/about/page.tsx',
 'src/components/*.tsx',...['AuthProviders','ProviderButton','HCaptcha','BottomBar','PlusMenu','ResultsCard'].map(name=>'!src/components/'+name+'.tsx'),
 'src/lib/**','!src/lib/auth/actions.ts','!src/lib/auth/password-reset.ts','!src/lib/pipeline/card-data.ts','src/middleware.ts',
];
export const converted = ['src/**/*.{ts,tsx}'];
export const lintTargets = ['src/i18n','src/components/i18n','src/components/support','src/app/admin/freeze-reports','src/app/(auth)','src/app/error.tsx','src/app/not-found.tsx','src/app/(tabs)/profile/about/page.tsx',...['AuthProviders','ProviderButton','HCaptcha','BottomBar','PlusMenu','ResultsCard'].map(name=>'src/components/'+name+'.tsx'),'src/lib/auth/actions.ts','src/lib/auth/password-reset.ts','src/lib/pipeline/card-data.ts'];
const visibleAttributes = new Set(['aria-label', 'aria-description', 'placeholder', 'title', 'alt', 'label']);
function hasFixedText(node) {
  if(!node) return false;
  if(node.type==='Literal') return typeof node.value==='string' && Boolean(node.value.trim());
  if(node.type==='TemplateLiteral') return node.quasis.some(part=>part.value.raw.trim());
  if(node.type==='ConditionalExpression') return hasFixedText(node.consequent)||hasFixedText(node.alternate);
  if(node.type==='LogicalExpression'||node.type==='BinaryExpression') return hasFixedText(node.left)||hasFixedText(node.right);
  if(node.type==='JSXExpressionContainer') return hasFixedText(node.expression);
  return false;
}
export const noFixedMessages = {
  meta: {type:'problem',schema:[],messages:{fixed:'Move user-facing text to the per-language message files.'}},
  create(context) {
    const report=node=>context.report({node,messageId:'fixed'});
    return {
      JSXAttribute(node) {
        if(visibleAttributes.has(node.name.name) && hasFixedText(node.value)) report(node);
      },
      CallExpression(node) {
        const name=node.callee.type==='Identifier'?node.callee.name:node.callee.property?.name;
        if(/^set(Error|Message|StatusMessage)$/.test(name??'') && hasFixedText(node.arguments[0])) report(node);
        if(name==='json') {
          const object=node.arguments[0];
          if(object?.type==='ObjectExpression') for(const property of object.properties) {
            if(property.type==='Property' && ['error','message'].includes(property.key.name??property.key.value) && hasFixedText(property.value)) report(property);
          }
        }
      },
    };
  },
};
