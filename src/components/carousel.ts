/**
 * TODO:
 * - Infinite slider
 */

/**
 * Description:
 * The carousel component is a simple slider that allows users to navigate through a series of slides.
 */
(function () {
  // Check if GSAP is included in the project
  if (window.gsap === undefined) {
    console.error(
      "Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI"
    )
    return
  }

  // Main Attributes
  const CAROUSEL_WRAPPER = 's-carousel="wrapper"' // required attribute for the carousel wrapper - used to group each carousel's elements
  const CAROUSEL_ROOT = 's-carousel="root"' // the slide container that will be moved
  const CAROUSEL_SLIDE = 's-carousel="slide"' // the individual slides
  const CAROUSEL_NEXT = 's-carousel="next"'
  const CAROUSEL_PREV = 's-carousel="prev"'
  const CAROUSEL_DOT = 's-carousel="dot"' // the dots navigation
  const CAROUSEL_PAUSE = 's-carousel="pause"' // the pause button - required if autoplay is true

  // Options
  const CAROUSEL_THRESHOLD = 's-threshold' // optional attribute for how much the user needs to drag to change slide (0.1 - 1), default is 0.3
  const ACTIVE_CLASS = 's-active-class' // default: 's-active'
  const DRAGGING_CLASS = 's-dragging-class' // default: 's-dragging'
  const DISABLED_CLASS = 's-disabled-class' // default: 's-disabled'
  const PAUSED_CLASS = 's-paused-class' // default: 's-paused'
  const AUTOPLAY_INTERVAL = 's-autoplay' // default: 5 (seconds)
  const DURATION = 's-duration' // default: 0.5 (seconds)
  const EASE = 's-ease' // default: 'power2.out'
  const LOOP = 's-loop' // default: false
  const SLIDES_TO_SCROLL = 's-slides-to-scroll' // default: 1

  // get all carousels
  const carousels = document.querySelectorAll(
    `[${CAROUSEL_WRAPPER}]`
  ) as NodeListOf<HTMLElement>

  class Carousel {
    private eventListeners: { [key: string]: Function[] } = {}
    wrapper: HTMLElement
    root: HTMLElement
    slides: HTMLElement[]
    nextButton: HTMLElement | null
    prevButton: HTMLElement | null
    dots: HTMLElement[]
    pauseButton: HTMLElement | null
    isPaused: boolean
    autoplayInterval: number | null
    autoplayTimeoutId: number | null
    currentIndex: number
    dragging: boolean
    startX: number
    currentX: number
    dragX: number
    threshold: number
    activeClass: string
    draggingClass: string
    disabledClass: string
    pausedClass: string
    isEnabled: boolean
    #xSetter: Function
    #xTo: Function
    slidePositions: number[]
    duration: number
    ease: string
    loop: boolean
    resizeTimeout: number | null = null
    liveRegion: HTMLElement
    slidesToScroll: number
    autoplayStartTime: number | null = null
    autoplayRemainingTime: number | null = null

    constructor(element: HTMLElement) {
      this.wrapper = element
      this.root = element.querySelector(`[${CAROUSEL_ROOT}]`) as HTMLElement
      this.slides = Array.from(element.querySelectorAll(`[${CAROUSEL_SLIDE}]`)) as HTMLElement[]
      this.nextButton = element.querySelector(`[${CAROUSEL_NEXT}]`)
      this.prevButton = element.querySelector(`[${CAROUSEL_PREV}]`)
      this.pauseButton = element.querySelector(`[${CAROUSEL_PAUSE}]`)
      this.dots = []
      this.currentIndex = 0
      this.dragging = false
      this.startX = 0
      this.currentX = 0
      this.dragX = 0
      this.threshold = 0.3 // threshold for dragging
      this.autoplayInterval = null
      this.autoplayTimeoutId = null
      this.activeClass = element.getAttribute(ACTIVE_CLASS) ? element.getAttribute(ACTIVE_CLASS) as string : 's-active'
      this.draggingClass = element.getAttribute(DRAGGING_CLASS) ? element.getAttribute(DRAGGING_CLASS) as string : 's-dragging'
      this.disabledClass = element.getAttribute(DISABLED_CLASS) ? element.getAttribute(DISABLED_CLASS) as string : 's-disabled'
      this.pausedClass = element.getAttribute(PAUSED_CLASS) ? element.getAttribute(PAUSED_CLASS) as string : 's-paused'
      this.isEnabled = true
      this.#xSetter = gsap.quickSetter(this.root, 'x', 'px')
      this.duration = element.getAttribute(DURATION) ? parseFloat(element.getAttribute(DURATION) as string) : 0.5
      this.ease = element.getAttribute(EASE) ? element.getAttribute(EASE) as string : 'power2.out'
      this.#xTo = this.#createQuickTo()
      this.slidePositions = []
      this.loop = element.getAttribute(LOOP) ? element.getAttribute(LOOP) === 'true' : false
      this.liveRegion = this.#createLiveRegion()
      this.isPaused = false
      this.slidesToScroll = element.getAttribute(SLIDES_TO_SCROLL) ? parseInt(element.getAttribute(SLIDES_TO_SCROLL) as string) : 1

      this.handleResize = this.handleResize.bind(this)
      this.init()
    }

    public on(eventName: string, callback: Function): void {
      if (!this.eventListeners[eventName]) {
        this.eventListeners[eventName] = []
      }
      this.eventListeners[eventName].push(callback)
    }

    public off(eventName: string, callback: Function): void {
      if (!this.eventListeners[eventName]) return
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(
        listener => listener !== callback
      )
    }

    #createQuickTo() {
      let quickTo = gsap.quickTo(this.root, 'x', { duration: this.duration, ease: this.ease })
      return (value: number) => {
        quickTo(value)
        quickTo = gsap.quickTo(this.root, 'x', { duration: this.duration, ease: this.ease })
      }
    }

    #emitEvent(eventName: string, detail: any = {}): void {
      // Call event listeners
      if (this.eventListeners[eventName]) {
        this.eventListeners[eventName].forEach(callback => callback(detail))
      }

      // Also dispatch DOM event for backward compatibility
      const event = new CustomEvent(`socks:carousel:${eventName}`, {
        bubbles: true,
        detail
      })
      this.wrapper.dispatchEvent(event)
    }

    init(): void {
      this.#setupOptions()
      this.#calculateSlidePositions()
      this.#createDots()
      this.#updateActiveStates()
      this.#setupPauseButton()
      if (this.autoplayInterval !== null && this.isEnabled) {
        this.startAutoplay()
        this.loop = true // if autoplay is enabled, loop is enabled
      }
      this.#updateButtonStates()
      this.#addEventListeners()
      this.#setupKeyboardNavigation()
      this.#updateAriaAttributes()
      window.addEventListener('resize', this.handleResize)

      // Emit init event
      this.#emitEvent('init', { carousel: this })
    }

    #addEventListeners(): void {
      if (!this.isEnabled) return

      this.root.addEventListener('mousedown', this.#onDragStart)
      this.root.addEventListener('mouseup', this.#onDragEnd)
      this.root.addEventListener('mousemove', this.#onDragMove)
      this.root.addEventListener('touchstart', this.#onDragStart)
      this.root.addEventListener('touchend', this.#onDragEnd)
      this.root.addEventListener('touchcancel', this.#onDragEnd)
      this.root.addEventListener('touchmove', this.#onDragMove)

      if (this.nextButton) {
        this.nextButton.addEventListener('click', this.goToNext)
        if (this.nextButton.nodeName !== 'BUTTON') {
          this.nextButton.setAttribute('tabindex', '0')
          this.nextButton.addEventListener('keydown', this.#handleButtonKeydown)
        }
      }
      if (this.prevButton) {
        this.prevButton.addEventListener('click', this.goToPrev)
        if (this.prevButton.nodeName !== 'BUTTON') {
          this.prevButton.setAttribute('tabindex', '0')
          this.prevButton.addEventListener('keydown', this.#handleButtonKeydown)
        }
      }
      // Add event listeners for dots
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          if (index !== this.currentIndex) {
            this.goToSlide(index)
          }
        })
        dot.addEventListener('keydown', (e) => {
          if (index !== this.currentIndex) {
            this.#handleDotKeydown(e, index)
          }
        })
      })
      if (this.pauseButton && this.autoplayInterval !== null) {
        this.pauseButton.addEventListener('click', this.#togglePause)
      }
    }

    handleResize(): void {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }
      this.resizeTimeout = window.setTimeout(() => {
        this.#calculateSlidePositions()
        this.resetSlider()
      }, 250) // 250ms debounce
    }

    #setupOptions(): void {
      const thresholdAttr = this.wrapper.getAttribute(CAROUSEL_THRESHOLD)
      if (thresholdAttr) {
        const threshold = parseFloat(thresholdAttr)
        if (!isNaN(threshold) && threshold >= 0.1 && threshold <= 1) {
          this.threshold = threshold
        }
      }

      const activeClassAttr = this.wrapper.getAttribute(ACTIVE_CLASS)
      if (activeClassAttr) this.activeClass = activeClassAttr

      const draggingClassAttr = this.wrapper.getAttribute(DRAGGING_CLASS)
      if (draggingClassAttr) this.draggingClass = draggingClassAttr

      const disabledClassAttr = this.wrapper.getAttribute(DISABLED_CLASS)
      if (disabledClassAttr) this.disabledClass = disabledClassAttr

      const autoplayAttr = this.wrapper.getAttribute(AUTOPLAY_INTERVAL)
      if (autoplayAttr) {
        const interval = parseInt(autoplayAttr)
        if (!isNaN(interval) && interval > 0) {
          this.autoplayInterval = interval * 1000
          if (!this.pauseButton) {
            console.error("Socks UI Carousel: Autoplay is enabled but no pause button found. Add an element with s-carousel=\"pause\" attribute for accessibility.")
          }
        }
      }
    }

    #createDots(): void {
      const dotTemplate = this.wrapper.querySelector(
        `[${CAROUSEL_DOT}]`
      ) as HTMLElement
      if (!dotTemplate) return

      const dotParent = dotTemplate.parentElement
      if (!dotParent) return

      // Remove active class from template if present
      dotTemplate.classList.remove(this.activeClass)

      // Clear existing dots
      dotParent.innerHTML = ''

      // this.slides.forEach((_, index) => {
      this.slidePositions.forEach((_, index) => {
        const dot = dotTemplate.cloneNode(true) as HTMLElement
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`)
        dot.setAttribute('role', 'button')
        dot.setAttribute('tabindex', '0')
        dotParent.appendChild(dot)
        this.dots.push(dot)
      })
    }

    #onDragStart = (e: MouseEvent | TouchEvent): void => {
      if (e.type === 'touchstart') e.preventDefault()
      this.dragging = true
      this.startX = 'touches' in e ? e.touches[0].clientX : e.clientX
      this.currentX = gsap.getProperty(this.root, 'x') as number
      this.wrapper.classList.add(this.draggingClass)

      // Pause autoplay when dragging starts
      if (this.autoplayInterval !== null && !this.isPaused) {
        this.stopAutoplay()
      }

      // Emit drag start event
      this.#emitEvent('dragstart', {
        startX: this.startX,
        currentX: this.currentX
      })
    }

    #onDragMove = (e: MouseEvent | TouchEvent): void => {
      if (!this.dragging) return
      const dragDistance = 'touches' in e ? e.touches[0].clientX - this.startX : e.clientX - this.startX
      const x = this.currentX + dragDistance
      this.dragX = dragDistance
      this.#xSetter(x)
    }

    #onDragEnd = (): void => {
      if (!this.dragging) return
      this.dragging = false
      this.wrapper.classList.remove(this.draggingClass)

      // Calculate the number of slides dragged
      const slideWidth = this.slides[0].offsetWidth
      const draggedPercentage = Math.abs(this.dragX) / slideWidth
      requestAnimationFrame(() => {
        let targetIndex = this.currentIndex

        // Check if the user has dragged the carousel enough to change the slide
        if (draggedPercentage > this.threshold) {
          const direction = this.dragX > 0 ? -1 : 1
          targetIndex = Math.max(0, Math.min(this.slides.length - this.slidesToScroll, this.currentIndex + direction))
        }

        // Update active states and button states immediately
        if (targetIndex !== this.currentIndex) {
          this.currentIndex = targetIndex
          this.#updateActiveStates()
          if (!this.loop) this.#updateButtonStates()
        }

        this.goToSlide(targetIndex)
        this.dragX = 0

        // Resume autoplay when dragging ends
        if (this.autoplayInterval !== null && this.isPaused) {
          this.startAutoplay()
        }

        // Emit drag end event
        this.#emitEvent('dragend', {
          dragDistance: this.dragX,
          currentIndex: this.currentIndex
        })
      })
    }

    #calculateSlidePositions(): void {
      this.slidePositions = [0]
      let currentPosition = 0
      for (let i = this.slidesToScroll; i < this.slides.length; i += this.slidesToScroll) {
        currentPosition -= this.slides[i].offsetLeft - this.slides[i - this.slidesToScroll].offsetLeft
        this.slidePositions.push(currentPosition)
      }
    }

    public goToSlide(index: number, animate: boolean = true): void {
      const previousIndex = this.currentIndex
      if (index < 0) index = 0
      if (index >= this.slides.length) index = this.slides.length - 1

      const x = this.slidePositions[index]
      if (animate) {
        this.#xTo(x)
      } else {
        this.#xSetter(x)
      }

      this.currentIndex = index
      this.#updateActiveStates()
      if (!this.loop) this.#updateButtonStates()

      if (this.autoplayInterval !== null) {
        this.stopAutoplay()
        this.startAutoplay()
      }
      this.#updateAriaAttributes()
      this.#announceSlideChange()

      // Emit slide change event
      this.#emitEvent('change', {
        currentIndex: this.currentIndex,
        previousIndex: previousIndex
      })
    }

    public goToNext = (): void => {
      if (this.nextButton?.getAttribute('aria-disabled') === 'true') return
      if (this.loop && this.currentIndex === this.slides.length - this.slidesToScroll) {
        this.goToSlide(0)
      } else {
        this.goToSlide(this.currentIndex + 1)
      }
    }

    public goToPrev = (): void => {
      if (this.prevButton?.getAttribute('aria-disabled') === 'true') return
      if (this.loop && this.currentIndex === 0) {
        this.goToSlide(this.slides.length - this.slidesToScroll)
      } else {
        this.goToSlide(this.currentIndex - this.slidesToScroll)
      }
    }

    #updateActiveStates(): void {
      const activeSlides = Array.from({ length: this.slidesToScroll }, (_, i) => this.currentIndex * this.slidesToScroll + i)
      this.slides.forEach((slide, index) => {
        const isActive = activeSlides.includes(index)
        slide.classList.toggle(this.activeClass, isActive)
        slide.setAttribute('aria-hidden', (!isActive).toString())
      })

      this.dots.forEach((dot, index) => {
        dot.classList.toggle(this.activeClass, index === this.currentIndex)
      })
    }

    #updateButtonStates(): void {
      const updateButton = (button: HTMLElement | null, label: string, isDisabled: boolean) => {
        if (button) {
          button.setAttribute('aria-label', label)
          if (button.nodeName !== 'BUTTON') {
            button.setAttribute('role', 'button')
            button.setAttribute('tabindex', '0')
          }
          if (this.loop) {
            button.classList.remove(this.disabledClass)
            button.removeAttribute('aria-disabled')
            button.removeAttribute('tabindex')
          } else {
            button.setAttribute('aria-disabled', isDisabled.toString())
            button.classList.toggle(this.disabledClass, isDisabled)
            if (isDisabled) {
              button.setAttribute('tabindex', '-1')
            } else {
              button.removeAttribute('tabindex')
            }
          }
        }
      }

      updateButton(this.prevButton, 'Previous slide', this.currentIndex === 0)
      updateButton(this.nextButton, 'Next slide', this.currentIndex === this.slides.length - this.slidesToScroll)
    }

    public startAutoplay(): void {
      if (this.isPaused) return
      this.stopAutoplay()

      const interval = this.autoplayRemainingTime !== null ? this.autoplayRemainingTime : (this.autoplayInterval ?? 5000)
      this.autoplayStartTime = Date.now()

      this.autoplayTimeoutId = window.setTimeout(() => {
        this.goToNext()
        this.autoplayRemainingTime = null
        this.startAutoplay()
      }, interval)
    }

    public stopAutoplay(): void {
      if (this.autoplayTimeoutId !== null) {
        window.clearTimeout(this.autoplayTimeoutId)
        this.autoplayTimeoutId = null

        if (this.autoplayStartTime !== null) {
          const elapsedTime = Date.now() - this.autoplayStartTime
          this.autoplayRemainingTime = Math.max(0, (this.autoplayInterval ?? 5000) - elapsedTime)
        }
      }
    }

    public resetSlider(): void {
      if (this.isEnabled) {
        // Go to the current slide (this will recalculate positions)
        this.goToSlide(this.currentIndex, false)

        // Recalculate and update everything
        this.#updateActiveStates()
        this.#updateButtonStates()

        // Restart autoplay if it was active
        if (this.autoplayInterval !== null) {
          this.stopAutoplay()
          this.startAutoplay()
        }
      }
    }

    public removeEventListeners(): void {
      this.root.removeEventListener('mousedown', this.#onDragStart)
      this.root.removeEventListener('mouseup', this.#onDragEnd)
      this.root.removeEventListener('mousemove', this.#onDragMove)
      this.root.removeEventListener('touchstart', this.#onDragStart)
      this.root.removeEventListener('touchend', this.#onDragEnd)
      this.root.removeEventListener('touchcancel', this.#onDragEnd)
      this.root.removeEventListener('touchmove', this.#onDragMove)

      if (this.nextButton) {
        this.nextButton.removeEventListener('click', this.goToNext)
        if (this.nextButton.nodeName !== 'BUTTON') {
          this.nextButton.removeAttribute('tabindex')
          this.nextButton.removeEventListener('keydown', this.#handleButtonKeydown)
        }
      }

      if (this.pauseButton && this.autoplayInterval !== null) {
        this.pauseButton.removeEventListener('click', this.#togglePause)
        if (this.pauseButton.nodeName !== 'BUTTON') {
          this.pauseButton.removeAttribute('tabindex')
          this.pauseButton.removeEventListener('keydown', this.#handleButtonKeydown)
        }
      }


      // Remove event listeners for dots
      this.dots.forEach((dot, index) => {
        dot.removeEventListener('click', () => this.goToSlide(index))
        dot.removeEventListener('keydown', (e) => this.#handleDotKeydown(e, index))
      })
    }

    #createLiveRegion(): HTMLElement {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.classList.add('s-carousel-live-region')
      liveRegion.style.position = 'absolute'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'
      liveRegion.style.clip = 'rect(0 0 0 0)'
      this.wrapper.appendChild(liveRegion)
      return liveRegion
    }

    #setupKeyboardNavigation(): void {
      this.root.setAttribute('tabindex', '0')
      this.root.addEventListener('keydown', this.#handleKeyDown)
    }

    #handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          this.goToPrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          this.goToNext()
          break
      }
    }

    #updateAriaAttributes(): void {
      this.root.setAttribute('aria-roledescription', 'carousel')
      this.slides.forEach((slide, index) => {
        slide.setAttribute('role', 'group')
        slide.setAttribute('aria-roledescription', 'slide')
        slide.setAttribute('aria-label', `${index + 1} of ${this.slides.length}`)
      })
    }

    #announceSlideChange(): void {
      const currentSlide = this.slides[this.currentIndex]
      const slideNumber = this.currentIndex + 1
      const totalSlides = this.slides.length
      const slideContent = currentSlide.getAttribute('aria-label') || `Slide ${slideNumber}`
      this.liveRegion.textContent = `${slideContent}, ${slideNumber} of ${totalSlides}`
    }

    #handleButtonKeydown = (e: KeyboardEvent): void => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
          ; (e.target as HTMLElement).click()
      }
    }

    #handleDotKeydown = (e: KeyboardEvent, index: number): void => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        this.goToSlide(index)
      }
    }

    #setupPauseButton(): void {
      if (this.pauseButton && this.autoplayInterval !== null) {
        this.pauseButton.addEventListener('click', this.#togglePause)
        if (this.pauseButton.nodeName !== 'BUTTON') {
          this.pauseButton.setAttribute('tabindex', '0')
          this.pauseButton.addEventListener('keydown', this.#handleButtonKeydown)
        }
        this.pauseButton.setAttribute('aria-label', 'Pause carousel')
      }
    }

    #togglePause = (): void => {
      this.isPaused = !this.isPaused
      if (this.isPaused) {
        this.stopAutoplay()
        this.pauseButton?.setAttribute('aria-label', 'Play carousel')
        this.pauseButton?.setAttribute('aria-pressed', 'true')
        this.pauseButton?.classList.add(this.pausedClass)
      } else {
        this.startAutoplay()
        this.pauseButton?.setAttribute('aria-label', 'Pause carousel')
        this.pauseButton?.setAttribute('aria-pressed', 'false')
        this.pauseButton?.classList.remove(this.pausedClass)
      }
    }

    public enable(): void {
      if (!this.isEnabled) {
        this.isEnabled = true
        this.#addEventListeners()
        this.#calculateSlidePositions()
        this.resetSlider()
        if (this.autoplayInterval !== null) {
          this.startAutoplay()
        }
      }
    }

    public disable(): void {
      if (this.isEnabled) {
        this.isEnabled = false
        this.removeEventListeners()
        this.stopAutoplay()
        this.#resetDisabledState()
      }
    }

    #resetDisabledState(): void {
      // Reset the root element's transform when carousel is disabled
      this.root.style.transform = ''

      // Remove active classes from slides and dots
      this.slides.forEach(slide => slide.classList.remove(this.activeClass))
      this.dots.forEach(dot => dot.classList.remove(this.activeClass))

      // Reset current index
      this.currentIndex = 0
    }

    public destroy(): void {
      this.removeEventListeners()
      this.stopAutoplay()
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }
      window.removeEventListener('resize', this.handleResize)
      this.root.removeEventListener('keydown', this.#handleKeyDown)
      this.wrapper.removeChild(this.liveRegion)
      if (this.pauseButton && this.autoplayInterval !== null) {
        this.pauseButton.removeEventListener('click', this.#togglePause)
      }

      // Emit destroy event
      this.#emitEvent('destroy', { carousel: this })
    }
  }

  // Usage
  const instances: { [key: string]: Carousel } = {}

  carousels.forEach((carousel, index) => {
    const instance = new Carousel(carousel)
    const instanceId = carousel.id || `carousel-${index}`
    instances[instanceId] = instance
  })

  // Expose instances to the global scope
  window.socks = { ...window.socks, carousel: instances }
})()
