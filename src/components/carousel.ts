(function () {
  // Check if GSAP is included in the project
  if (window.gsap === undefined) {
    console.error(
      "Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI"
    )
    return
  }

  // Main Attributes
  const CAROUSEL_WRAPPER = 's-carousel="wrapper"'
  const CAROUSEL_ROOT = 's-carousel="root"'
  const CAROUSEL_SLIDE = 's-carousel="slide"'
  const CAROUSEL_NEXT = 's-carousel="next"'
  const CAROUSEL_PREV = 's-carousel="prev"'
  const CAROUSEL_DOT = 's-carousel="dot"'

  // Options
  const CAROUSEL_THRESHOLD = 's-threshold' // optional attribute for how much the user needs to drag to change slide (0.1 - 1), default is 0.3
  const ACTIVE_CLASS = 's-active-class' // default: 's-active'
  const DRAGGING_CLASS = 's-dragging-class' // default: 's-dragging'
  const DISABLED_CLASS = 's-disabled-class' // default: 's-disabled'
  const AUTOPLAY_INTERVAL = 's-autoplay' // default: 5 (seconds)

  // get all carousels
  const carousels = document.querySelectorAll(
    `[${CAROUSEL_WRAPPER}]`
  ) as NodeListOf<HTMLElement>

  class Carousel {
    private wrapper: HTMLElement
    private root: HTMLElement
    private slides: HTMLElement[]
    private nextButton: HTMLElement | null
    private prevButton: HTMLElement | null
    private dots: HTMLElement[]
    private liveRegion: HTMLElement | undefined
    private currentIndex: number
    private dragging: boolean
    private startX: number
    private currentX: number
    private slidesPositions: number[]
    private currentDrag: number
    private threshold: number = 0.3
    private autoplayInterval: number | null = null
    private autoplayTimeoutId: number | null = null
    private activeClass: string = 's-active'
    private draggingClass: string = 's-dragging'
    private disabledClass: string = 's-disabled'
    private breakpoints: { [key: number]: boolean } = {}
    private isEnabled: boolean = true
    private xSetter: Function
    private xTo: Function
    private dragMoveCallback: (() => void) | null = null;
    private dragStartCallback: (() => void) | null = null;
    private dragEndCallback: (() => void) | null = null;

    constructor(element: HTMLElement) {
      this.wrapper = element
      this.root = element.querySelector(`[${CAROUSEL_ROOT}]`) as HTMLElement
      this.slides = Array.from(
        element.querySelectorAll(`[${CAROUSEL_SLIDE}]`)
      ) as HTMLElement[]
      if (this.slides.length === 0) {
        this.slides = Array.from(element.children) as HTMLElement[]
      }
      this.nextButton = element.querySelector(`[${CAROUSEL_NEXT}]`)
      this.prevButton = element.querySelector(`[${CAROUSEL_PREV}]`)
      this.dots = []
      this.currentIndex = 0
      this.dragging = false
      this.startX = 0
      this.currentX = 0
      this.slidesPositions = []
      this.currentDrag = 0
      this.xSetter = gsap.quickSetter(this.root, "x", "px")
      this.xTo = gsap.quickTo(this.root, "x", { duration: 0.5, ease: "power2.out" })

      this.init()
    }

    public init(): void {
      this.setupOptions()
      this.setupBreakpoints()
      this.initCarousel()
      this.addEventListeners()
      this.setupAccessibility()
      this.updateLiveRegion()
      this.createDots()
      this.updateActiveStates()
      this.checkBreakpoint()
      if (this.autoplayInterval !== null && this.isEnabled) {
        this.startAutoplay()
      }
    }

    private setupOptions(): void {
      if (this.wrapper.hasAttribute(CAROUSEL_THRESHOLD)) {
        const threshold = parseFloat(
          this.wrapper.getAttribute(CAROUSEL_THRESHOLD) as string
        )
        if (threshold >= 0.1 && threshold <= 1) {
          this.threshold = threshold
        } else {
          console.error(
            'Socks UI: The threshold value must be between 0.1 and 1'
          )
        }
      }

      if (this.wrapper.hasAttribute(ACTIVE_CLASS)) {
        this.activeClass = this.wrapper.getAttribute(ACTIVE_CLASS) as string
      }

      if (this.wrapper.hasAttribute(DRAGGING_CLASS)) {
        this.draggingClass = this.wrapper.getAttribute(DRAGGING_CLASS) as string
      }

      if (this.wrapper.hasAttribute(DISABLED_CLASS)) {
        this.disabledClass = this.wrapper.getAttribute(DISABLED_CLASS) as string
      }

      if (this.wrapper.hasAttribute(AUTOPLAY_INTERVAL)) {
        const interval = parseInt(
          this.wrapper.getAttribute(AUTOPLAY_INTERVAL) as string
        )
        if (!isNaN(interval) && interval > 0) {
          this.autoplayInterval = interval
        }
      }
    }

    private setupBreakpoints(): void {
      const breakpointAttributes = Array.from(this.wrapper.attributes)
        .filter(attr => attr.name.startsWith('s-bp-'))
        .sort((a, b) => parseInt(b.name.split('-')[2]) - parseInt(a.name.split('-')[2]))

      breakpointAttributes.forEach(attr => {
        const breakpoint = parseInt(attr.name.split('-')[2])
        this.breakpoints[breakpoint] = attr.value.toLowerCase() !== 'off'
      })
    }

    private checkBreakpoint(): void {
      const windowWidth = window.innerWidth
      let isEnabled = true

      for (const [breakpoint, enabled] of Object.entries(this.breakpoints)) {
        if (windowWidth <= parseInt(breakpoint)) {
          isEnabled = enabled
          break
        }
      }

      if (isEnabled !== this.isEnabled) {
        this.isEnabled = isEnabled
        this.toggleCarousel(isEnabled)
      }
    }

    private toggleCarousel(enable: boolean): void {
      if (enable) {
        this.wrapper.classList.remove(this.disabledClass)
        this.addEventListeners()
        if (this.autoplayInterval !== null) {
          this.startAutoplay()
        }
      } else {
        this.wrapper.classList.add(this.disabledClass)
        this.removeEventListeners()
        this.stopAutoplay()
      }
    }

    private initCarousel(): void {
      this.slidesPositions = this.calculateSlidePositions()
      gsap.set(this.root, { x: 0 })
    }

    private calculateSlidePositions(): number[] {
      let positions: number[] = [0]
      let currentPosition = 0
      for (let i = 1; i < this.slides.length; i++) {
        currentPosition +=
          this.slides[i].offsetLeft - this.slides[i - 1].offsetLeft
        positions.push(currentPosition)
      }
      return positions
    }

    private addEventListeners(): void {
      if (!this.isEnabled) return

      this.root.addEventListener('mousedown', this.onDragStart.bind(this))
      this.root.addEventListener('touchstart', this.onDragStart.bind(this))
      window.addEventListener('mousemove', this.onDragMove.bind(this))
      window.addEventListener('touchmove', this.onDragMove.bind(this))
      window.addEventListener('mouseup', this.onDragEnd.bind(this))
      window.addEventListener('touchend', this.onDragEnd.bind(this))

      if (this.nextButton) {
        this.nextButton.addEventListener('click', this.onNextClick.bind(this))
      }
      if (this.prevButton) {
        this.prevButton.addEventListener('click', this.onPrevClick.bind(this))
      }
    }

    private removeEventListeners(): void {
      this.root.removeEventListener('mousedown', this.onDragStart.bind(this))
      this.root.removeEventListener('touchstart', this.onDragStart.bind(this))
      window.removeEventListener('mousemove', this.onDragMove.bind(this))
      window.removeEventListener('touchmove', this.onDragMove.bind(this))
      window.removeEventListener('mouseup', this.onDragEnd.bind(this))
      window.removeEventListener('touchend', this.onDragEnd.bind(this))

      if (this.nextButton) {
        this.nextButton.removeEventListener('click', this.onNextClick.bind(this))
      }
      if (this.prevButton) {
        this.prevButton.removeEventListener('click', this.onPrevClick.bind(this))
      }
    }

    private onNextClick(): void {
      this.goToSlide(this.currentIndex + 1)
    }

    private onPrevClick(): void {
      this.goToSlide(this.currentIndex - 1)
    }

    public setDragStartCallback(callback: () => void): void { this.dragStartCallback = callback }

    public setDragEndCallback(callback: () => void): void { this.dragEndCallback = callback }

    public setDragMoveCallback(callback: () => void): void { this.dragMoveCallback = callback }

    private onDragStart(e: MouseEvent | TouchEvent): void {
      e.preventDefault()
      this.dragging = true
      this.startX = 'touches' in e ? e.touches[0].clientX : e.clientX
      this.currentX = gsap.getProperty(this.root, 'x') as number
      this.wrapper.classList.add(this.draggingClass)

      gsap.killTweensOf(this.root)
      this.stopAutoplay()

      if (this.dragStartCallback) { this.dragStartCallback() }
    }

    private onDragMove(e: MouseEvent | TouchEvent): void {
      if (!this.dragging || !this.isEnabled) return

      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const diff = currentX - this.startX
      const newX = this.currentX + diff
      this.currentDrag = diff / this.slides[this.currentIndex].offsetWidth
      // this.currentDrag = diff / this.root.offsetWidth

      // gsap.set(this.root, { x: newX })
      this.xSetter(newX)

      // Call the custom callback if it's set
      if (this.dragMoveCallback) { this.dragMoveCallback() }
    }

    private onDragEnd(): void {
      if (!this.dragging || !this.isEnabled) return
      this.dragging = false
      this.wrapper.classList.remove(this.draggingClass)

      // const threshold = this.threshold * this.root.offsetWidth
      if (
        Math.abs(this.currentDrag) > this.threshold &&
        this.currentIndex + (this.currentDrag > 0 ? -1 : 1) >= 0 &&
        this.currentIndex + (this.currentDrag > 0 ? -1 : 1) < this.slides.length
      ) {
        const newIndex = this.currentIndex + (this.currentDrag > 0 ? -1 : 1)
        this.goToSlide(newIndex)
      } else {
        gsap.to(this.root, {
          x: -this.slidesPositions[this.currentIndex],
          duration: 0.5,
          ease: 'power2.out',
        })
      }

      if (this.autoplayInterval !== null) {
        this.startAutoplay()
      }

      if (this.dragEndCallback) { this.dragEndCallback() }
    }

    public goToSlide(index: number, animate: boolean = true): void {
      if (!this.isEnabled) return
      if (index < 0) index = 0
      if (index >= this.slides.length) index = this.slides.length - 1

      if (index === this.currentIndex) return

      if (animate) {
        this.xTo(-this.slidesPositions[index])
      } else {
        this.xSetter(-this.slidesPositions[index])
      }

      this.currentIndex = index
      this.updateAriaAttributes()
      this.updateLiveRegion()
      this.updateActiveStates()

      // Interrupt and restart autoplay
      if (this.autoplayInterval !== null) {
        this.stopAutoplay()
        this.startAutoplay()
      }
    }

    private setupAccessibility(): void {
      this.wrapper.setAttribute('aria-roledescription', 'carousel')
      this.root.setAttribute('aria-live', 'polite')
      this.root.setAttribute('aria-atomic', 'true')

      this.slides.forEach((slide, index) => {
        slide.setAttribute('role', 'group')
        slide.setAttribute('aria-roledescription', 'slide')
        slide.setAttribute(
          'aria-label',
          `${index + 1} of ${this.slides.length}`
        )
      })

      this.setupNavigationButtons()
      this.createLiveRegion()
      this.updateAriaAttributes()

      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') this.goToSlide(this.currentIndex + 1)
        if (e.key === 'ArrowLeft') this.goToSlide(this.currentIndex - 1)
      })
    }

    private setupNavigationButtons(): void {
      const setupButton = (button: HTMLElement | null, label: string) => {
        if (button) {
          if (button instanceof HTMLButtonElement) {
            button.disabled = false
          } else {
            button.setAttribute('role', 'button')
            button.setAttribute('tabindex', '0')
          }
          button.setAttribute('aria-label', label)
        }
      }

      setupButton(this.nextButton, 'Next slide')
      setupButton(this.prevButton, 'Previous slide')
    }

    private createLiveRegion(): void {
      this.liveRegion = document.createElement('div')
      this.liveRegion.setAttribute('aria-live', 'polite')
      this.liveRegion.setAttribute('aria-atomic', 'true')
      this.liveRegion.classList.add('sr-only')
      this.wrapper.appendChild(this.liveRegion)
    }

    private updateAriaAttributes(): void {
      this.slides.forEach((slide, index) => {
        slide.setAttribute(
          'aria-hidden',
          (index !== this.currentIndex).toString()
        )
      })

      this.updateButtonState(this.nextButton, this.currentIndex === this.slides.length - 1)
      this.updateButtonState(this.prevButton, this.currentIndex === 0)
    }

    private updateButtonState(button: HTMLElement | null, isDisabled: boolean): void {
      if (!button) return

      if (button instanceof HTMLButtonElement) {
        button.disabled = isDisabled
      }

      button.setAttribute('aria-disabled', isDisabled.toString())
      button.classList.toggle(this.disabledClass, isDisabled)
    }

    private updateLiveRegion(): void {
      if (!this.liveRegion) return
      this.liveRegion.textContent = `Slide ${this.currentIndex + 1} of ${this.slides.length}`
    }

    private createDots(): void {
      const dotTemplate = this.wrapper.querySelector(`[${CAROUSEL_DOT}]`) as HTMLElement
      if (!dotTemplate) return

      const dotParent = dotTemplate.parentElement
      if (!dotParent) return

      // Remove active class from template if present
      dotTemplate.classList.remove(this.activeClass)

      // Clear existing dots
      dotParent.innerHTML = ''

      this.slides.forEach((_, index) => {
        const dot = dotTemplate.cloneNode(true) as HTMLElement
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`)
        dot.addEventListener('click', () => this.goToSlide(index))
        dotParent.appendChild(dot)
        this.dots.push(dot)
      })
    }

    private updateActiveStates(): void {
      this.slides.forEach((slide, index) => {
        slide.classList.toggle(this.activeClass, index === this.currentIndex)
      })

      this.dots.forEach((dot, index) => {
        dot.classList.toggle(this.activeClass, index === this.currentIndex)
      })
    }

    private startAutoplay(): void {
      if (this.autoplayInterval === null) return
      this.stopAutoplay()
      this.autoplayTimeoutId = window.setTimeout(() => {
        this.goToSlide((this.currentIndex + 1) % this.slides.length)
        this.startAutoplay()
      }, this.autoplayInterval * 1000)
    }

    private stopAutoplay(): void {
      if (this.autoplayTimeoutId !== null) {
        window.clearTimeout(this.autoplayTimeoutId)
        this.autoplayTimeoutId = null
      }
    }

    public onResize(): void {
      this.checkBreakpoint()
      if (this.isEnabled) {
        this.slidesPositions = this.calculateSlidePositions()
        this.goToSlide(this.currentIndex, false)
      }
    }
  }

  // Usage
  let instances: { [key: string]: Carousel } = {}
  carousels.forEach((carousel, index) => {
    const current = new Carousel(carousel as HTMLElement)
    instances = { ...instances, [`carousel-${index}`]: current }
  })

  // Add window resize event listener
  let resizeTimeout: number | null = null
  window.addEventListener('resize', () => {
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout)
    }
    resizeTimeout = window.setTimeout(() => {
      for (const key in instances) {
        instances[key].onResize()
      }
    }, 250) // Debounce resize event
  })

  window.socks = { ...window.socks, carousel: instances }
})()