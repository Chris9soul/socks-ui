(function () {
  /**
   * TODO: 
   * - Allow custom animations (duration, easing, scale/rotate, etc.)
   */
  // Check if GSAP is included in the project
  if (window.gsap === undefined) {
    console.error("Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI")
    return
  }

  // Main Attributes
  const MODAL_WRAPPER = 's-modal="wrapper"' // the parent element of the modal
  const MODAL_ROOT = 's-modal="root"' // the actual modal element
  const MODAL_OVERLAY = 's-modal="overlay"' // overlay element that closes the modal when clicked
  const MODAL_TITLE = 's-modal="title"' // optional title - helps with accessibility
  const MODAL_CLOSE = 's-modal="close"' // elements that should close the modal
  const MODAL_TRIGGER = 's-modal-trigger' // buttons that trigger the modal

  // Options
  const MODAL_MANUAL = 's-manual' // optional attribute to not need a trigger to open the modal

  // get all modal triggers
  const modals = document.querySelectorAll(`[${MODAL_WRAPPER}]`) as NodeListOf<HTMLElement>

  // check if modals are present
  if (modals.length === 0) {
    console.error(`Socks UI: Couldn't find any modal wrappers. Make sure to add the [s-modal="wrapper"] attribute to your modal wrappers.`)
    return
  }

  let modalMethods: { [key: string]: { open: () => void, close: () => void } } = {}

  modals.forEach((modal, index) => {
    // get modal's ID
    const modalID = modal.getAttribute('id')
    if (!modalID) {
      console.error(`Socks UI: Modal ${index} is missing an ID. Please provide an ID for your modal wrapper.`)
      return
    }
    modal.style.overflow = 'hidden' // prevent scrolling on the modal wrapper

    // find this modal's triggers
    const modalTriggers = document.querySelectorAll(`[${MODAL_TRIGGER}=${modalID}]`) as NodeListOf<HTMLElement>

    const isManual = modal.hasAttribute(MODAL_MANUAL)
    // check if modal triggers are present
    if (modalTriggers.length === 0 && !isManual) {
      console.error(`Socks UI: Couldn't find any triggers for modal ${modalID}. Make sure to add the [s-modal-trigger="${modalID}"] attribute to your modal triggers.`)
      return
    }

    // find modal element
    const modalElement = modal.querySelector(`[${MODAL_ROOT}]`) as HTMLElement
    if (!modalElement) {
      console.error(`Socks UI: Modal ${modalID} is missing a modal element. Please add an element with the [s-modal="element"] attribute to your modal wrapper.`)
      return
    }

    // set modal element attributes
    modalElement.setAttribute('role', 'dialog')
    modalElement.setAttribute('aria-modal', 'true')
    modalElement.setAttribute('aria-hidden', 'true')
    modalElement.setAttribute('tabindex', '-1')
    // set modal styles
    modalElement.style.overflowY = 'auto'

    // find modal title (Optional)
    const modalTitle = modal.querySelector(`[${MODAL_TITLE}]`) as HTMLElement | null
    if (modalTitle) {
      modalTitle.id = `${modalID}-title`// set title ID
      modalElement.setAttribute('aria-labelledby', modalTitle.id)
    } else {
      // if there is no title, check for aria-label attribute
      if (!modalElement.hasAttribute('aria-label')) {
        console.error(`Socks UI: Modal ${modalID} is missing a title. Either add a title element with the [s-modal="title"] attribute or provide an aria-label attribute to the modal element.`)
      }
    }

    // find modal overlay (Optional)
    const modalOverlay = modal.querySelector(`[${MODAL_OVERLAY}]`) as HTMLElement | null

    // find modal close buttons
    const modalCloseButtons = modal.querySelectorAll(`[${MODAL_CLOSE}]`) as NodeListOf<HTMLElement>
    if (modalCloseButtons.length === 0) {
      console.error(`Socks UI: Modal ${modalID} is missing a close button. Please add an element with the [s-modal="close"] attribute to your modal wrapper.`)
      return
    }

    /**
     *  Create animation timeline
    */
    gsap.set(modal, { display: 'none' })

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        modalElement.focus() // Set focus on the modal when it's opened
      },
    })
    tl.set(modal, { display: 'flex' })
    tl.from(modalOverlay, { duration: 0.2, opacity: 0 })
    tl.from(modalElement, { duration: 0.2, scale: 0.95, opacity: 0 }, '<')

    let focusedElementBeforeModal: HTMLElement | null = null // Store previously focused element

    // open modal function
    const openModal = () => {
      focusedElementBeforeModal = document.activeElement as HTMLElement // Capture focus before opening modal
      modalElement.setAttribute('aria-hidden', 'false')

      // play timeline
      tl.play()
      // stop scrolling on the body
      document.body.style.overflow = 'hidden'

      // Add event listener to trap focus within the modal
      modal.addEventListener('keydown', trapFocus)

      // dispatch custom event
      const openEvent = new CustomEvent('modal-open', { detail: modal })
      window.dispatchEvent(openEvent)
    }

    // close modal function
    const closeModal = () => {
      modalElement.setAttribute('aria-hidden', 'true')
      tl.reverse()

      // allow scrolling on the body (remove overflow property)
      document.body.style.overflow = ''

      // Remove event listener to trap focus within the modal
      modal.removeEventListener('keydown', trapFocus)

      // Return focus to the element that had it before the modal opened
      focusedElementBeforeModal?.focus()

      // dispatch custom event
      const closeEvent = new CustomEvent('modal-close', { detail: modal })
      window.dispatchEvent(closeEvent)
    }

    // store modal methods
    modalMethods[modalID] = { open: openModal, close: closeModal }

    const focusableElements = modal.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
    const firstFocusableElement = focusableElements[0] as HTMLElement
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement
    function trapFocus(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault()
            lastFocusableElement.focus()
          }
        } else { // Tab
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault()
            firstFocusableElement.focus()
          }
        }
      } else if (event.key === 'Escape') {
        closeModal()
      }
    }

    /**
     * Interactions
     */
    // set trigger attributes
    modalTriggers.forEach((trigger) => {
      trigger.setAttribute('aria-haspopup', 'dialog')
      trigger.setAttribute('aria-controls', modalID)
      trigger.setAttribute('aria-expanded', 'false')
      trigger.addEventListener('click', openModal)
    })

    // set modal close buttons attributes
    modalCloseButtons.forEach((button) => {
      button.setAttribute('aria-label', 'Close modal')
      button.setAttribute('aria-controls', modalID)
      button.setAttribute('aria-expanded', 'true')
      if (button.tagName !== 'BUTTON') {
        button.setAttribute('role', 'button')
        button.setAttribute('tabindex', '0')
      }
      button.addEventListener('click', closeModal)
    })

    // modal overlay interaction
    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal)
    }
  }) // end of modals loop

  // Add modal methods to the global scope
  window.socks = { ...window.socks, modals: modalMethods }
})()