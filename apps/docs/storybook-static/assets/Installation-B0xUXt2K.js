import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{useMDXComponents as s}from"./index-BxvCFfQM.js";import{M as a}from"./index-bJrtOKza.js";import"./index-yIsmwZOr.js";import"./iframe-DTzrwFtQ.js";import"./index-DYPOUmoU.js";import"./index-DLXLKNMB.js";import"./index-DrFu-skq.js";function t(r){const n={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...s(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(a,{title:"Getting Started/Installation"}),`
`,e.jsx(n.h1,{id:"installation",children:"Installation"}),`
`,e.jsxs(n.p,{children:["Use ",e.jsx(n.code,{children:"@paapeli/ui-kit"})," in apps that already run on the monorepo workspace."]}),`
`,e.jsx(n.h2,{id:"1-add-the-package",children:"1. Add the package"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`pnpm add @paapeli/ui-kit
`})}),`
`,e.jsx(n.p,{children:"If the package is consumed from another workspace app in this repository, keep it as a workspace dependency:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-json",children:`{
  "dependencies": {
    "@paapeli/ui-kit": "workspace:*"
  }
}
`})}),`
`,e.jsx(n.h2,{id:"2-load-the-shared-styles",children:"2. Load the shared styles"}),`
`,e.jsx(n.p,{children:"Import the shared UI kit stylesheet once near your app entry point."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`import '@paapeli/ui-kit/styles';
`})}),`
`,e.jsxs(n.p,{children:["For Storybook, the import typically belongs in ",e.jsx(n.code,{children:".storybook/preview.ts"})," or ",e.jsx(n.code,{children:".storybook/preview.tsx"}),":"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`import type { Preview } from '@storybook/react';
import '@paapeli/ui-kit/styles';

const preview: Preview = {};

export default preview;
`})}),`
`,e.jsx(n.h2,{id:"3-import-components",children:"3. Import components"}),`
`,e.jsx(n.p,{children:"Components are exported from the package root:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`import { Button, Card, CardContent, CardHeader, CardTitle } from '@paapeli/ui-kit';
`})}),`
`,e.jsx(n.p,{children:"You can also import from the components entry directly:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`import { Button, Card } from '@paapeli/ui-kit/components';
`})}),`
`,e.jsx(n.h2,{id:"4-render-a-component",children:"4. Render a component"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`import { Button, Card, CardContent, CardHeader, CardTitle } from '@paapeli/ui-kit';
import '@paapeli/ui-kit/styles';

export function ExampleCard() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Paapeli UI Kit</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <span className="text-sm text-paapeli-muted-foreground">
          Shared components and design tokens.
        </span>
        <Button size="sm">Continue</Button>
      </CardContent>
    </Card>
  );
}
`})}),`
`,e.jsx(n.h2,{id:"notes",children:"Notes"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The package expects ",e.jsx(n.code,{children:"react"})," and ",e.jsx(n.code,{children:"react-dom"})," as peer dependencies."]}),`
`,e.jsxs(n.li,{children:["Storybook docs in this repo already load the shared stylesheet from ",e.jsx(n.a,{href:"/Users/user/Desktop/projects/Paapeli-Client/apps/docs/.storybook/preview.tsx",children:e.jsx(n.code,{children:"apps/docs/.storybook/preview.tsx"})}),"."]}),`
`,e.jsxs(n.li,{children:["Design token reference pages live alongside this guide under ",e.jsx(n.code,{children:"apps/docs/src/stories"}),"."]}),`
`]})]})}function x(r={}){const{wrapper:n}={...s(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(t,{...r})}):t(r)}export{x as default};
