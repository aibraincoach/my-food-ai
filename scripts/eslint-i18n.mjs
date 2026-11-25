export const readingLintTargets=["src/app/layout.tsx","src/components/SavedMealListeners.tsx","src/components/FoodSearchPanel.tsx","src/components/IntakeSheet.tsx","src/components/LogAgainSheet.tsx","src/components/SavedMealsButton.tsx","src/components/SavedMealsSheet.tsx","src/components/CorrectProductAction.tsx","src/components/CorrectProductSheet.tsx","src/components/ItemEditSheet.tsx","src/components/NeedsInputSheet.tsx","src/components/OutlineOverlay.tsx","src/components/ItemRows.tsx","src/components/NutritionSummary.tsx","src/components/NutritionTable.tsx","src/components/OpenFoodFactsAttribution.tsx","src/components/PostDetail.tsx","src/components/Carousel.tsx","src/components/Thread.tsx","src/components/CommentComposer.tsx","src/components/PostDetailHeader.tsx","src/components/DeletePostSheet.tsx","src/components/EatenAtEditor.tsx","src/components/PostMenu.tsx","src/components/PostActions.tsx","src/components/PostCaption.tsx","src/components/PostHandle.tsx","src/components/PostReadinessListener.tsx","src/components/SavePhoto.tsx","src/components/ThumbsFeedback.tsx","src/components/ui/Sheet.tsx","src/components/PostCard.tsx","src/components/LocalTime.tsx","src/lib/time/local.ts","src/components/Feed.tsx","src/components/NeedsInputStrip.tsx","src/components/PushPrompt.tsx","src/components/UndoToast.tsx","src/components/DayHeader.tsx","src/components/DayRings.tsx","src/components/PostPageShell.tsx","src/components/PostOpenFrame.tsx","src/components/PostOpenTransition.tsx","src/components/PostDetailSkeleton.tsx","src/app/(tabs)/layout.tsx","src/app/(tabs)/page.tsx","src/app/(tabs)/error.tsx","src/app/posts/[id]/layout.tsx","src/app/posts/[id]/page.tsx","src/app/posts/[id]/loading.tsx","src/app/(tabs)/days/loading.tsx","src/components/DaysView.tsx","src/components/MonthGrid.tsx","src/components/PhoneCalendar.tsx","src/components/GoToMonthSheet.tsx","src/components/StoryPlayer.tsx","src/components/NavigationControls.tsx","src/components/DesktopDays.tsx","src/components/DesktopToday.tsx","src/components/DesktopWorkspace.tsx","src/components/Sidebar.tsx","src/components/ShortcutsDialog.tsx","src/app/(tabs)/search/page.tsx","src/app/(tabs)/search/loading.tsx","src/components/SearchBox.tsx","src/app/(tabs)/profile/page.tsx","src/app/(tabs)/profile/loading.tsx","src/components/ProfileAvatarControl.tsx","src/components/ProfileGrid.tsx","src/components/ProfileNutritionTile.tsx","src/components/SignOutButton.tsx","src/app/(tabs)/profile/IdentifyProviderSwitch.tsx","src/components/ConnectAgentRow.tsx","src/app/profile/agents/page.tsx","src/app/profile/agents/new/page.tsx","src/app/profile/agents/layout.tsx","src/app/profile/agents/AgentList.tsx","src/app/profile/agents/RevokeSheet.tsx","src/app/profile/agents/TokenShown.tsx","src/app/profile/agents/new/NewAgentForm.tsx","src/app/(tabs)/profile/deleted/page.tsx","src/app/(tabs)/profile/deleted/DeletedPosts.tsx","src/app/admin/page.tsx","src/app/admin/posts/[id]/page.tsx"];
export const captureLintTargets = [
  "src/components/CaptureSheet.tsx",
  "src/components/LightComposer.tsx",
  "src/components/ComposerDrinks.tsx",
  "src/components/UploadingPost.tsx",
  "src/components/FirstRunHint.tsx",
  "src/components/UploadChip.tsx",
  "src/components/ModeStrip.tsx",
  "src/components/UploadBar.tsx",
  "src/components/VoiceRecorder.tsx",
  "src/components/VoiceButton.tsx",
  "src/components/CameraPreview.tsx",
  "src/components/BarcodeScanner.tsx",
  "src/components/DrinkPicture.tsx",
  "src/components/useDrinkCard.ts",
  "src/app/(tabs)/profile/CameraModeSwitch.tsx",
  "src/lib/posts/upload-manager.ts",
  "src/lib/posts/upload-store.ts",
  "src/lib/posts/capture-failure.ts",
  "src/lib/posts/create.ts",
  "src/lib/media/camera.ts",
  "src/lib/media/pack-photo-upload.ts",
  "src/lib/media/staged-photo.ts"
];
// Enforced on converted directories only; each slice expands the scope.
// All remaining src directories are temporary migration exemptions, removed
// at slice 6. Do not add a converted directory back to the exemptions.
export const untranslatedNamesAndUnits = ['My Food AI','@','?','—','Enter','Esc','N','D','J / K','← →','↑ ↓','kcal','g','ml','mg','(',')','+','·','···','‹','›','×','/','1/1','✎','−'];
// Dynamic route brackets are literals, not glob character classes.
const lintPathPattern=file=>file.replace(/[\[\]]/g,character=>'\\'+character);
export const serverLintTargets=['src/app/api/**','src/app/mcp/**','src/app/profile/agents/actions.ts','src/lib/agents/**','src/lib/limits/user-cap.ts','src/lib/posts/barcode-correction.ts','src/lib/posts/caption.ts','src/lib/posts/caption-client.ts','src/lib/posts/copy-operation.ts','src/lib/posts/attach-photo.ts','src/lib/intake/drink-operation.ts'];
export const deferred = [
 'src/app/**','!src/app/admin/freeze-reports/**','!src/app/(auth)/**','!src/app/error.tsx','!src/app/not-found.tsx','!src/app/(tabs)/profile/about/page.tsx',
 'src/components/*.tsx',...readingLintTargets.map(file=>'!'+lintPathPattern(file)),...['AuthProviders','ProviderButton','HCaptcha','BottomBar','PlusMenu','ResultsCard'].map(name=>'!src/components/'+name+'.tsx'),
 ...captureLintTargets.filter(file=>!file.startsWith('src/lib/')).map(file=>'!'+file),
 'src/lib/**','!src/lib/auth/actions.ts','!src/lib/auth/password-reset.ts','!src/lib/pipeline/card-data.ts','src/middleware.ts',...captureLintTargets.filter(file=>file.startsWith('src/lib/')).map(file=>'!'+file),...readingLintTargets.filter(file=>file.startsWith('src/lib/')).map(file=>'!'+file),
];
deferred.push(...serverLintTargets.map(file=>'!'+file));
export const converted = ['src/**/*.{ts,tsx}'];
export const nutritionLintTargets=['src/lib/posts/summary-line.ts','src/lib/posts/saved-summary.ts','src/lib/nutrition/totals.ts','src/lib/nutrition/table.ts','src/lib/fdc/unavailable.ts','src/lib/pipeline/wording.ts','src/lib/worker/failure-message.ts'];
deferred.push(...nutritionLintTargets.map(file=>'!'+file));
export const lintTargets = [...nutritionLintTargets,...serverLintTargets,...captureLintTargets,...readingLintTargets,'src/i18n','src/components/i18n','src/components/support','src/app/admin/freeze-reports','src/app/(auth)','src/app/error.tsx','src/app/not-found.tsx','src/app/(tabs)/profile/about/page.tsx',...['AuthProviders','ProviderButton','HCaptcha','BottomBar','PlusMenu','ResultsCard'].map(name=>'src/components/'+name+'.tsx'),'src/lib/auth/actions.ts','src/lib/auth/password-reset.ts','src/lib/pipeline/card-data.ts'];
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
