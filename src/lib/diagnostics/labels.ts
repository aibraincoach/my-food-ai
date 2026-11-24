import type messages from '../../../messages/en.json';
type SupportKey=keyof typeof messages.support;
import type {DiagnosticEvent} from './schema';
const events:Record<string,SupportKey>={'page-load':'eventPageLoad',screen:'eventScreen',visibility:'eventVisibility',update:'eventUpdate',camera:'eventCamera',sheet:'eventSheet'};
const values:Record<string,Record<string,SupportKey>>={
 screen:{feed:'screenFeed',post:'screenPost',days:'screenDays',search:'screenSearch',profile:'screenProfile',about:'screenAbout',deleted:'screenDeleted',agents:'screenAgents',admin:'screenAdmin',welcome:'screenWelcome','sign-in':'screenSignIn','sign-up':'screenSignUp',handle:'screenHandle',reset:'screenReset',other:'screenOther'},
 visibility:{visible:'visibilityVisible',hidden:'visibilityHidden'},update:{found:'updateFound',waiting:'updateWaiting',deferred:'updateDeferred',reloading:'updateReloading'},
 camera:{opening:'cameraOpening',ready:'cameraReady',closed:'cameraClosed','failed:NotAllowedError':'cameraNotAllowed','failed:NotFoundError':'cameraNotFound','failed:NotReadableError':'cameraNotReadable','failed:OverconstrainedError':'cameraOverconstrained','failed:AbortError':'cameraAborted','failed:SecurityError':'cameraSecurity','failed:InvalidStateError':'cameraInvalidState','failed:NotSupportedError':'cameraNotSupported','failed:other':'cameraOtherFailure'},
 sheet:{'capture-open':'sheetCaptureOpen','capture-close':'sheetCaptureClose'},
};
export function eventLabel(event:DiagnosticEvent,t:(key:SupportKey)=>string){return t(events[event.name])+(event.value===undefined?'':`: ${t(values[event.name][event.value])}`);}
export const permissionKey:Record<string,SupportKey>={granted:'permissionGranted',denied:'permissionDenied',prompt:'permissionPrompt',unknown:'permissionUnknown'};
