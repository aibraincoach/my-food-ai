'use client';
import {Icon} from './ui/Icon';
export default function SavedMealsButton(){return <button className="flex min-h-tap min-w-tap items-center justify-center" aria-label="Saved meals" onClick={()=>window.dispatchEvent(new CustomEvent('open-saved'))}><Icon name="bookmark"/></button>;}
