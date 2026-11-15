Triage by coder, head 57a5921e6a136512f934cc604cfb102244975f10, model Gemini 4 Hydrogen (request proof and footer agree).
1. Missing onPointerCancel leaves thumbs stuck in pressed state on cancelled touch gestures — Real (minor, verified: only Up/Leave handled).
2. Navigation before async save — Not real (reviewer confirms safe via the unmount cleanup).
3. save() attaches post-settled/post-ready window listeners with no unmount cleanup — Real (minor, verified lines 20-24; cleanup only fires inside the handlers).
4. Stuck pending state when the post settles just before save() runs — Real (verified: waits for events that already fired).
5. Unsave on a failed post clobbers a previously saved id to null via finishBookmark — Real (verified line 25; same family as #702).
Real findings: 4 (items 1, 3, 4, 5)
