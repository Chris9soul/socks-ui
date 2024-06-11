"use strict";(function(){if(window.gsap===void 0){console.error("Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI");return}const h='s-modal="wrapper"',w='s-modal="root"',E='s-modal="overlay"',v='s-modal="title"',g='s-modal="close"',k="s-modal-trigger",S="s-manual",c=document.querySelectorAll(`[${h}]`);if(c.length===0){console.error(`Socks UI: Couldn't find any modal wrappers. Make sure to add the [s-modal="wrapper"] attribute to your modal wrappers.`);return}let u={};c.forEach((t,M)=>{const r=t.getAttribute("id");if(!r){console.error(`Socks UI: Modal ${M} is missing an ID. Please provide an ID for your modal wrapper.`);return}t.style.overflow="hidden";const m=document.querySelectorAll(`[${k}=${r}]`),L=t.hasAttribute(S);if(m.length===0&&!L){console.error(`Socks UI: Couldn't find any triggers for modal ${r}. Make sure to add the [s-modal-trigger="${r}"] attribute to your modal triggers.`);return}const o=t.querySelector(`[${w}]`);if(!o){console.error(`Socks UI: Modal ${r} is missing a modal element. Please add an element with the [s-modal="element"] attribute to your modal wrapper.`);return}o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-hidden","true"),o.setAttribute("tabindex","-1"),o.style.maxHeight="90vh",o.style.overflowY="auto";const i=t.querySelector(`[${v}]`);i?(i.id=`${r}-title`,o.setAttribute("aria-labelledby",i.id)):o.hasAttribute("aria-label")||console.error(`Socks UI: Modal ${r} is missing a title. Either add a title element with the [s-modal="title"] attribute or provide an aria-label attribute to the modal element.`);const n=t.querySelector(`[${E}]`),f=t.querySelectorAll(`[${g}]`);if(f.length===0){console.error(`Socks UI: Modal ${r} is missing a close button. Please add an element with the [s-modal="close"] attribute to your modal wrapper.`);return}gsap.set(t,{display:"none"});const s=gsap.timeline({paused:!0,onComplete:()=>{o.focus()}});s.set(t,{display:"flex"}),s.from(n,{duration:.2,opacity:0}),s.from(o,{duration:.2,scale:.95,opacity:0},"<");let a=null;const p=()=>{a=document.activeElement,o.setAttribute("aria-hidden","false"),s.play(),document.body.style.overflow="hidden",t.addEventListener("keydown",A);const e=new CustomEvent("modal-open",{detail:t});window.dispatchEvent(e)},l=()=>{o.setAttribute("aria-hidden","true"),s.reverse(),document.body.style.overflow="",t.removeEventListener("keydown",A),a==null||a.focus();const e=new CustomEvent("modal-close",{detail:t});window.dispatchEvent(e)};u[r]={open:p,close:l};const d=t.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'),b=d[0],y=d[d.length-1];function A(e){e.key==="Tab"?e.shiftKey?document.activeElement===b&&(e.preventDefault(),y.focus()):document.activeElement===y&&(e.preventDefault(),b.focus()):e.key==="Escape"&&l()}m.forEach(e=>{e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-controls",r),e.setAttribute("aria-expanded","false"),e.addEventListener("click",p)}),f.forEach(e=>{e.setAttribute("aria-label","Close modal"),e.setAttribute("aria-controls",r),e.setAttribute("aria-expanded","true"),e.tagName!=="BUTTON"&&(e.setAttribute("role","button"),e.setAttribute("tabindex","0")),e.addEventListener("click",l)}),n&&n.addEventListener("click",l)}),window.socks={...window.socks,modal:u}})();
