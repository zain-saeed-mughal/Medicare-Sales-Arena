import { reportServiceError } from "./service";
import {useEffect,useState} from 'react';
const key='medicare-arena.dev.display-heartbeat';
/** Only a real display sends heartbeats. An embedded monitor cannot report itself online. */
export function useDisplayPresence(display=false){
 const [online,setOnline]=useState(false);
 useEffect(()=>{
   if(!import.meta.env.DEV)return;
   const update=()=>{try{if(display)localStorage.setItem(key,String(Date.now()));else setOnline(Date.now()-Number(localStorage.getItem(key))<18000)}catch(error){reportServiceError(error)}};
   update();const timer=setInterval(update,5000);
   return()=>clearInterval(timer);
 },[display]);return online;
}
