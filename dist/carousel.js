"use strict";var x=Object.defineProperty;var w=(h,r,l)=>r in h?x(h,r,{enumerable:!0,configurable:!0,writable:!0,value:l}):h[r]=l;var s=(h,r,l)=>(w(h,typeof r!="symbol"?r+"":r,l),l);(function(){if(window.gsap===void 0){console.error("Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI");return}const h='s-carousel="wrapper"',r='s-carousel="root"',l='s-carousel="slide"',v='s-carousel="next"',A='s-carousel="prev"',f='s-carousel="dot"',E='s-carousel="pause"',b="s-threshold",y="s-active-class",S="s-dragging-class",L="s-disabled-class",m="s-autoplay",d="s-duration",c="s-ease",p="s-loop",T=document.querySelectorAll(`[${h}]`);class B{constructor(t){s(this,"wrapper");s(this,"root");s(this,"slides");s(this,"nextButton");s(this,"prevButton");s(this,"dots");s(this,"currentIndex");s(this,"dragging");s(this,"startX");s(this,"currentX");s(this,"dragX");s(this,"threshold");s(this,"autoplayInterval");s(this,"autoplayTimeoutId");s(this,"activeClass");s(this,"draggingClass");s(this,"disabledClass");s(this,"isEnabled");s(this,"xSetter");s(this,"xTo");s(this,"slidePositions");s(this,"duration");s(this,"ease");s(this,"loop");s(this,"resizeTimeout",null);s(this,"liveRegion");s(this,"pauseButton");s(this,"isPaused");s(this,"onDragStart",t=>{t.type==="touchstart"&&t.preventDefault(),this.dragging=!0,this.startX="touches"in t?t.touches[0].clientX:t.clientX,this.currentX=gsap.getProperty(this.root,"x"),this.wrapper.classList.add(this.draggingClass),this.stopAutoplay()});s(this,"onDragMove",t=>{if(!this.dragging)return;const e="touches"in t?t.touches[0].clientX-this.startX:t.clientX-this.startX,i=this.currentX+e;this.dragX=e,this.xSetter(i)});s(this,"onDragEnd",()=>{if(!this.dragging)return;this.dragging=!1,this.wrapper.classList.remove(this.draggingClass);const t=this.slides[0].offsetWidth,e=Math.abs(this.dragX)/t;requestAnimationFrame(()=>{let i=this.currentIndex;if(e>this.threshold){const o=this.dragX>0?-1:1;i=Math.max(0,Math.min(this.slides.length-1,this.currentIndex+o))}i!==this.currentIndex&&(this.currentIndex=i,this.updateActiveStates(),this.loop||this.updateButtonStates()),this.goToSlide(i),this.dragX=0,this.autoplayInterval!==null&&this.startAutoplay()})});s(this,"goToNext",()=>{this.loop&&this.currentIndex===this.slides.length-1?this.goToSlide(0):this.goToSlide(this.currentIndex+1)});s(this,"goToPrev",()=>{this.loop&&this.currentIndex===0?this.goToSlide(this.slides.length-1):this.goToSlide(this.currentIndex-1)});s(this,"handleKeyDown",t=>{switch(t.key){case"ArrowLeft":t.preventDefault(),this.goToPrev();break;case"ArrowRight":t.preventDefault(),this.goToNext();break}});s(this,"handleButtonKeydown",t=>{(t.key===" "||t.key==="Enter")&&(t.preventDefault(),t.target.click())});s(this,"handleDotKeydown",(t,e)=>{(t.key===" "||t.key==="Enter")&&(t.preventDefault(),this.goToSlide(e))});s(this,"togglePause",()=>{var t,e,i,o;this.isPaused=!this.isPaused,this.isPaused?(this.stopAutoplay(),(t=this.pauseButton)==null||t.setAttribute("aria-label","Play carousel"),(e=this.pauseButton)==null||e.setAttribute("aria-pressed","true")):(this.startAutoplay(),(i=this.pauseButton)==null||i.setAttribute("aria-label","Pause carousel"),(o=this.pauseButton)==null||o.setAttribute("aria-pressed","false"))});this.wrapper=t,this.root=t.querySelector(`[${r}]`),this.slides=Array.from(t.querySelectorAll(`[${l}]`)),this.nextButton=t.querySelector(`[${v}]`),this.prevButton=t.querySelector(`[${A}]`),this.dots=[],this.currentIndex=0,this.dragging=!1,this.startX=0,this.currentX=0,this.dragX=0,this.threshold=.3,this.autoplayInterval=null,this.autoplayTimeoutId=null,this.activeClass="s-active",this.draggingClass="s-dragging",this.disabledClass="s-disabled",this.isEnabled=!0,this.xSetter=gsap.quickSetter(this.root,"x","px"),this.duration=t.getAttribute(d)?parseFloat(t.getAttribute(d)):.5,this.ease=t.getAttribute(c)?t.getAttribute(c):"power2.out",this.xTo=this.createQuickTo(),this.slidePositions=[],this.loop=t.getAttribute(p)?t.getAttribute(p)==="true":!1,this.liveRegion=this.createLiveRegion(),this.pauseButton=t.querySelector(`[${E}]`),this.isPaused=!1,this.handleResize=this.handleResize.bind(this),this.init()}createQuickTo(){let t=gsap.quickTo(this.root,"x",{duration:this.duration,ease:this.ease});return e=>{t(e),t=gsap.quickTo(this.root,"x",{duration:this.duration,ease:this.ease})}}init(){this.setupOptions(),this.createDots(),this.updateActiveStates(),this.setupPauseButton(),this.autoplayInterval!==null&&this.isEnabled&&(this.startAutoplay(),this.loop=!0),this.updateButtonStates(),this.calculateSlidePositions(),this.addEventListeners(),this.setupKeyboardNavigation(),this.updateAriaAttributes(),window.addEventListener("resize",this.handleResize)}addEventListeners(){this.isEnabled&&(this.root.addEventListener("mousedown",this.onDragStart),this.root.addEventListener("mouseup",this.onDragEnd),this.root.addEventListener("mousemove",this.onDragMove),this.root.addEventListener("touchstart",this.onDragStart),this.root.addEventListener("touchend",this.onDragEnd),this.root.addEventListener("touchcancel",this.onDragEnd),this.root.addEventListener("touchmove",this.onDragMove),this.nextButton&&(this.nextButton.addEventListener("click",this.goToNext),this.nextButton.nodeName!=="BUTTON"&&(this.nextButton.setAttribute("tabindex","0"),this.nextButton.addEventListener("keydown",this.handleButtonKeydown))),this.prevButton&&(this.prevButton.addEventListener("click",this.goToPrev),this.prevButton.nodeName!=="BUTTON"&&(this.prevButton.setAttribute("tabindex","0"),this.prevButton.addEventListener("keydown",this.handleButtonKeydown))),this.dots.forEach((t,e)=>{t.addEventListener("click",()=>{e!==this.currentIndex&&this.goToSlide(e)}),t.addEventListener("keydown",i=>{e!==this.currentIndex&&this.handleDotKeydown(i,e)})}),this.pauseButton&&this.autoplayInterval!==null&&this.pauseButton.addEventListener("click",this.togglePause))}handleResize(){this.resizeTimeout&&clearTimeout(this.resizeTimeout),this.resizeTimeout=window.setTimeout(()=>{this.calculateSlidePositions(),this.resetSlider()},250)}setupOptions(){const t=this.wrapper.getAttribute(b);if(t){const n=parseFloat(t);!isNaN(n)&&n>=.1&&n<=1&&(this.threshold=n)}const e=this.wrapper.getAttribute(y);e&&(this.activeClass=e);const i=this.wrapper.getAttribute(S);i&&(this.draggingClass=i);const o=this.wrapper.getAttribute(L);o&&(this.disabledClass=o);const a=this.wrapper.getAttribute(m);if(a){const n=parseInt(a);!isNaN(n)&&n>0&&(this.autoplayInterval=n*1e3,this.pauseButton||console.error('Socks UI Carousel: Autoplay is enabled but no pause button found. Add an element with s-carousel="pause" attribute for accessibility.'))}}createDots(){const t=this.wrapper.querySelector(`[${f}]`);if(!t)return;const e=t.parentElement;e&&(t.classList.remove(this.activeClass),e.innerHTML="",this.slides.forEach((i,o)=>{const a=t.cloneNode(!0);a.setAttribute("aria-label",`Go to slide ${o+1}`),a.setAttribute("role","button"),a.setAttribute("tabindex","0"),e.appendChild(a),this.dots.push(a)}))}calculateSlidePositions(){this.slidePositions=[0];let t=0;for(let e=1;e<this.slides.length;e++)t-=this.slides[e].offsetLeft-this.slides[e-1].offsetLeft,this.slidePositions.push(t)}goToSlide(t,e=!0){t<0&&(t=0),t>=this.slides.length&&(t=this.slides.length-1);const i=this.slidePositions[t];e?this.xTo(i):this.xSetter(i),this.currentIndex=t,this.updateActiveStates(),this.loop||this.updateButtonStates(),this.autoplayInterval!==null&&(this.stopAutoplay(),this.startAutoplay()),this.updateAriaAttributes(),this.announceSlideChange()}updateActiveStates(){this.slides.forEach((t,e)=>{t.classList.toggle(this.activeClass,e===this.currentIndex)}),this.dots.forEach((t,e)=>{t.classList.toggle(this.activeClass,e===this.currentIndex)})}updateButtonStates(){const t=(e,i,o)=>{e&&(e.setAttribute("aria-label",i),e.nodeName!=="BUTTON"&&(e.setAttribute("role","button"),e.setAttribute("tabindex","0")),this.loop?(e.classList.remove(this.disabledClass),e.removeAttribute("aria-disabled"),e.removeAttribute("tabindex")):(e.setAttribute("aria-disabled",o.toString()),e.classList.toggle(this.disabledClass,o),o?e.setAttribute("tabindex","-1"):e.removeAttribute("tabindex")))};t(this.prevButton,"Previous slide",this.currentIndex===0),t(this.nextButton,"Next slide",this.currentIndex===this.slides.length-1)}startAutoplay(){this.isPaused||(this.stopAutoplay(),this.autoplayTimeoutId=window.setTimeout(()=>{this.goToNext(),this.startAutoplay()},this.autoplayInterval??5e3))}stopAutoplay(){this.autoplayTimeoutId!==null&&(window.clearTimeout(this.autoplayTimeoutId),this.autoplayTimeoutId=null)}resetSlider(){this.isEnabled&&(this.goToSlide(this.currentIndex,!1),this.updateActiveStates(),this.updateButtonStates(),this.autoplayInterval!==null&&(this.stopAutoplay(),this.startAutoplay()))}removeEventListeners(){this.root.removeEventListener("mousedown",this.onDragStart),this.root.removeEventListener("mouseup",this.onDragEnd),this.root.removeEventListener("mousemove",this.onDragMove),this.root.removeEventListener("touchstart",this.onDragStart),this.root.removeEventListener("touchend",this.onDragEnd),this.root.removeEventListener("touchcancel",this.onDragEnd),this.root.removeEventListener("touchmove",this.onDragMove),this.nextButton&&(this.nextButton.removeEventListener("click",this.goToNext),this.nextButton.nodeName!=="BUTTON"&&(this.nextButton.removeAttribute("tabindex"),this.nextButton.removeEventListener("keydown",this.handleButtonKeydown))),this.prevButton&&(this.prevButton.removeEventListener("click",this.goToPrev),this.prevButton.nodeName!=="BUTTON"&&(this.prevButton.removeAttribute("tabindex"),this.prevButton.removeEventListener("keydown",this.handleButtonKeydown))),this.dots.forEach((t,e)=>{t.removeEventListener("click",()=>this.goToSlide(e)),t.removeEventListener("keydown",i=>this.handleDotKeydown(i,e))}),this.pauseButton&&this.autoplayInterval!==null&&this.pauseButton.removeEventListener("click",this.togglePause)}createLiveRegion(){const t=document.createElement("div");return t.setAttribute("aria-live","polite"),t.setAttribute("aria-atomic","true"),t.classList.add("s-carousel-live-region"),t.style.position="absolute",t.style.width="1px",t.style.height="1px",t.style.overflow="hidden",t.style.clip="rect(0 0 0 0)",this.wrapper.appendChild(t),t}setupKeyboardNavigation(){this.root.setAttribute("tabindex","0"),this.root.addEventListener("keydown",this.handleKeyDown)}updateAriaAttributes(){this.root.setAttribute("aria-roledescription","carousel"),this.slides.forEach((t,e)=>{t.setAttribute("role","group"),t.setAttribute("aria-roledescription","slide"),t.setAttribute("aria-label",`${e+1} of ${this.slides.length}`)})}announceSlideChange(){const t=this.slides[this.currentIndex],e=this.currentIndex+1,i=this.slides.length,o=t.getAttribute("aria-label")||`Slide ${e}`;this.liveRegion.textContent=`${o}, ${e} of ${i}`}setupPauseButton(){this.pauseButton&&this.autoplayInterval!==null&&(this.pauseButton.addEventListener("click",this.togglePause),this.pauseButton.setAttribute("aria-label","Pause carousel"),this.pauseButton.setAttribute("aria-pressed","false"))}enable(){this.isEnabled||(this.isEnabled=!0,this.addEventListeners(),this.calculateSlidePositions(),this.resetSlider(),this.autoplayInterval!==null&&this.startAutoplay())}disable(){this.isEnabled&&(this.isEnabled=!1,this.removeEventListeners(),this.stopAutoplay(),this.resetDisabledState())}resetDisabledState(){this.root.style.transform="",this.slides.forEach(t=>t.classList.remove(this.activeClass)),this.dots.forEach(t=>t.classList.remove(this.activeClass)),this.currentIndex=0}destroy(){this.removeEventListeners(),this.stopAutoplay(),this.resizeTimeout&&clearTimeout(this.resizeTimeout),window.removeEventListener("resize",this.handleResize),this.root.removeEventListener("keydown",this.handleKeyDown),this.wrapper.removeChild(this.liveRegion),this.pauseButton&&this.autoplayInterval!==null&&this.pauseButton.removeEventListener("click",this.togglePause)}}const g={};T.forEach((u,t)=>{const e=new B(u),i=u.id||`carousel-${t}`;g[i]=e}),window.socks={...window.socks,carousel:g}})();
