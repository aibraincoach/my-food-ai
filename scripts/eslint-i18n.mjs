export const untranslatedNamesAndUnits = ['My Food AI','@','?','—','Enter','Esc','N','D','J / K','← →','↑ ↓','kcal','g','ml','mg','(',')','+','·','···','‹','›','×','/','1/1','✎','−'];
export const converted = ['src/**/*.{ts,tsx}'];
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
// The upstream JSX rule misses literal branches nested inside expressions.
function hasVisibleLiteral(node) {
 if(!node)return false;
 if(node.type==='Literal'&&typeof node.value==='string')return /\p{L}/u.test(node.value)&&!untranslatedNamesAndUnits.includes(node.value.trim());
 if(node.type==='TemplateLiteral')return node.quasis.some(part=>hasVisibleLiteral({type:'Literal',value:part.value.cooked??part.value.raw}))||node.expressions.some(hasVisibleLiteral);
 if(node.type==='ConditionalExpression')return hasVisibleLiteral(node.consequent)||hasVisibleLiteral(node.alternate);
 if(node.type==='LogicalExpression')return node.operator==='&&'?hasVisibleLiteral(node.right):hasVisibleLiteral(node.left)||hasVisibleLiteral(node.right);
 if(node.type==='BinaryExpression'&&node.operator==='+')return hasVisibleLiteral(node.left)||hasVisibleLiteral(node.right);
 if(node.type==='ArrayExpression')return node.elements.some(hasVisibleLiteral);
 return false;
}
export const noFixedMessages = {
  meta: {type:'problem',schema:[],messages:{fixed:'Move user-facing text to the per-language message files.'}},
  create(context) {
    const report=node=>context.report({node,messageId:'fixed'});
    return {
      JSXExpressionContainer(node) {
        if(node.parent.type!=='JSXAttribute'&&hasVisibleLiteral(node.expression))report(node);
      },
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
