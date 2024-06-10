import gsap from 'gsap'

declare global {
  interface Window {
    gsap?: typeof gsap
    socks?: Object<any>
  }
}
export { } // Required for ambient module declarations