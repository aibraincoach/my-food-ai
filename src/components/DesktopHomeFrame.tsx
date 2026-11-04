import type {ReactNode} from 'react';
// Home and the offline shell share the 6a desktop column layout.
export default function DesktopHomeFrame({children,today,shell=false}:{children:ReactNode;today?:ReactNode;shell?:boolean}) {
 return <div className="desktop-home-layout desktop:flex desktop:items-start"><main className="flex flex-1 flex-col desktop:w-[500px] desktop:min-w-0 desktop:flex-none" data-shell={shell?'':undefined}>{children}</main>{today}</div>;
}
