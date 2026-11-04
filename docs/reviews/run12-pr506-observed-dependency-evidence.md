# Supplemental observed dependency and browser evidence for PR506 confirmation

This is observed installed dependency/runtime evidence, not committed exact-head application source. The exact-head patch manifest remains authoritative for application changes. Independently assess the prior two retry findings against this pinned framework implementation.

## node_modules/next/package.json
SHA256: b67bad7944d603b27dd2d2719b57203fd3b3e5c147b2efa6dea5ceb135274caf

Installed Next.js version: 16.4.3

## node_modules/next/dist/client/components/error-boundary.js
SHA256: 579eef61438b0f29e4b9009bd01d51ebbd52baa22026be318a5721c9ddad0db3

```js
36:         this.contextType = _approutercontextsharedruntime.AppRouterContext;
37:     }
38:     constructor(props){
39:         super(props), this.reset = ()=>{
40:             this.setState({
41:                 error: null
42:             });
43:         }, this.retry = ()=>{
44:             (0, _react.startTransition)(()=>{
45:                 this.context?.refresh();
46:                 this.reset();
47:             });
48:         };
49:         this.state = {
50:             error: null,
51:             previousPathname: this.props.pathname
52:         };
53:     }
106:             return /*#__PURE__*/ (0, _jsxruntime.jsxs)(_jsxruntime.Fragment, {
107:                 children: [
108:                     this.props.errorStyles,
109:                     this.props.errorScripts,
110:                     /*#__PURE__*/ (0, _jsxruntime.jsx)(this.props.errorComponent, {
111:                         // TODO(NAR-804): Docs say this is an Error object, but we don't guarantee that
112:                         error: thrownValue,
113:                         reset: this.reset,
114:                         retry: this.retry
115:                     })
116:                 ]
117:             });
```

## node_modules/next/dist/client/components/error-boundary.d.ts
SHA256: bfd922cd6c7e5404cb2beb99ab0be844b0440dc8ad220894ad32efb85db97bcd

```ts
import React, { type JSX } from 'react';
import { type AppRouterInstance } from '../../shared/lib/app-router-context.shared-runtime';
export type ErrorInfo = {
    error: unknown;
    reset: () => void;
    retry: () => void;
};
export type ErrorComponent = React.ComponentType<ErrorInfo>;
export interface ErrorBoundaryProps {
    children?: React.ReactNode;
    errorComponent: ErrorComponent | undefined;
    errorStyles?: React.ReactNode | undefined;
    errorScripts?: React.ReactNode | undefined;
}
interface ErrorBoundaryHandlerProps extends ErrorBoundaryProps {
    pathname: string | null;
    errorComponent: ErrorComponent;
}
interface ErrorBoundaryHandlerState {
    error: null | {
        thrownValue: unknown;
    };
    previousPathname: string | null;
}
export declare class ErrorBoundaryHandler extends React.Component<ErrorBoundaryHandlerProps, ErrorBoundaryHandlerState> {
    static contextType: React.Context<AppRouterInstance | null>;
    context: AppRouterInstance | null;
    constructor(props: ErrorBoundaryHandlerProps);
    static getDerivedStateFromError(thrownValue: unknown): Partial<ErrorBoundaryHandlerState>;
    static getDerivedStateFromProps(props: ErrorBoundaryHandlerProps, state: ErrorBoundaryHandlerState): ErrorBoundaryHandlerState | null;
    reset: () => void;
    retry: () => void;
    render(): React.ReactNode;
}
/**
 * Handles errors through `getDerivedStateFromError`.
 * Renders the provided error component and provides a way to `reset` the error boundary state.
 */
/**
 * Renders error boundary with the provided "errorComponent" property as the fallback.
 * If no "errorComponent" property is provided it renders the children without an error boundary.
 */
export declare function ErrorBoundary({ errorComponent, errorStyles, errorScripts, children, }: ErrorBoundaryProps & {
    children: React.ReactNode;
}): JSX.Element;
export {};

```

## node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md
SHA256: c3d3493c85b2a34354add83092933a5978d5b663b8bf062c3201221383fff73a

```md
1: ---
2: title: error.js
3: description: API reference for the error.js special file.
4: related:
5:   title: Learn more about error handling
6:   links:
7:     - app/getting-started/error-handling
8: ---
9: 
10: An **error** file allows you to handle unexpected runtime errors and display fallback UI.
11: 
12: <Image
13:   alt="error.js special file"
14:   srcLight="/docs/light/error-special-file.png"
15:   srcDark="/docs/dark/error-special-file.png"
16:   width="1600"
17:   height="606"
18: />
19: 
20: ```tsx filename="app/dashboard/error.tsx" switcher
21: 'use client' // Error boundaries must be Client Components
22: 
23: import { useEffect } from 'react'
24: 
25: export default function Error({
26:   error,
27:   retry,
28: }: {
29:   error: unknown
30:   retry: () => void
31: }) {
32:   useEffect(() => {
33:     // Log the error to an error reporting service
34:     console.error(error)
35:   }, [error])
36: 
37:   return (
38:     <div>
39:       <h2>Something went wrong!</h2>
40:       <button
41:         onClick={
42:           // Attempt to recover by re-fetching and re-rendering the segment
43:           () => retry()
44:         }
45:       >
119: The cause of an error can sometimes be temporary. In these cases, trying again might resolve the issue.
120: 
121: An error component can use the `retry()` function to prompt the user to attempt to recover from the error. When executed, the function will try to re-fetch and re-render the error boundary's children. If successful, the fallback error component is replaced with the result of the re-render.
122: 
123: ```tsx filename="app/dashboard/error.tsx" switcher
124: 'use client' // Error boundaries must be Client Components
125: 
126: export default function Error({
127:   error,
128:   retry,
129: }: {
130:   error: unknown
131:   retry: () => void
132: }) {
133:   return (
134:     <div>
135:       <h2>Something went wrong!</h2>
136:       <button onClick={() => retry()}>Try again</button>
137:     </div>
138:   )
139: }
140: ```
141: 
142: ```jsx filename="app/dashboard/error.js" switcher
143: 'use client' // Error boundaries must be Client Components
144: 
145: export default function Error({ error, retry }) {
146:   return (
```

## Observed local production browser checks
Source: /tmp/run12-error-browser-evidence.json
SHA256: 58ea91ed17413a7fe44508444f91ad5bcf04a43ae320a02fbbba298934ed891f
Browser evidence from a local production build with temporary conditional throw probes. Source restored after verification; no probe forms part of the reviewed application head. Both retry buttons recovered; detail after-state contains a populated scripted meal fixture.
```json
{
  "runtime": "local production build with temporary conditional probe; source restored after verification",
  "results": [
    {
      "route": "/days",
      "before": {
        "text": "My Food AI\n\nThis page could not be loaded.\n\nTry again\nCamera\nText\nDrink\nCoffee\nSaved",
        "overflow": false,
        "button": true
      },
      "after": {
        "text": "Feed\nDays\n\nLoading…\n\nR\nCamera\nText\nDrink\nCoffee\nSaved",
        "overflow": false
      }
    },
    {
      "route": "/posts/[missing-id]",
      "before": {
        "text": "My Food AI\n\nThis page could not be loaded.\n\nTry again\nBack to the feed",
        "overflow": false,
        "button": true
      },
      "after": {
        "text": "Feed\nPost\n\nTue, Nov 3 · 8:56 PM\n\n···\nCONSUMED · 8:56 PM\n1200\nkcal\n20 g\nprotein\n50 g\ncarbs\n40 g\nfat\nScripted retry meal 100 g\n\n Run12 retry fixture\n\n1200\nkcal\n20 g\nprotein\n50 g\ncarbs\n40 g\nfat\nConsumed · all nutrients\nShow all 7\nServings\n−\n1\n+\nComments 0\nCamera\nText\nDrink\nCoffee\nSaved",
        "overflow": false
      }
    },
    {
      "route": "/days/2099-01-01",
      "text": "My Food AI\n\nThis page does not exist.\n\nBack to the feed"
    }
  ]
}

```
