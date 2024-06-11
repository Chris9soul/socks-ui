/**
 * Todos/Notes:
 * - 
 */
(function () {
  // Check if GSAP is included in the project
  if (window.gsap === undefined) {
    console.error("Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI")
    return
  }

  // Main Attributes
  const ACCORDION_GROUP = 's-accordion="group"'
  const ACCORDION_ROOT = 's-accordion="root"'
  const ACCORDION_TRIGGER = 's-accordion="trigger"'
  const ACCORDION_CONTENT = 's-accordion="content"'
  const DEFAULT_EASE = 'power3.inOut'
  const DEFAULT_DURATION = 0.5
  const DEFAULT_OPEN_CLASS = 's-active' // Default class that will be added to open accordions

  // Options
  const EASE_ATTRIBUTE = 's-ease' // Allows custom easing
  const DURATION_ATTRIBUTE = 's-duration' // Allows custom duration
  const MULTIPLE_ATTRIBUTE = 's-multiple' // Allows multiple accordions to be open at the same time
  const FIRST_OPEN_ATTRIBUTE = 's-first-open' // Allows first accordion to be open by default
  const ADD_ACTIVE_CLASS_ATTRIBUTE = 's-add-class' // Allows custom active class that will be added to elements that have it
  const ACTIVE_CLASS_ATTRIBUTE = 's-active-class' // Allows custom active class that will be added to elements that have s-add-active-class

  // Get all accordion groups
  const accordionGroups = document.querySelectorAll(`[${ACCORDION_GROUP}]`)
  // check if accordion groups are present
  if (accordionGroups.length === 0) {
    console.error("Socks UI: Couldn't find any accordion groups. Make sure to add the [s-accordion='group'] attribute to your accordion groups.")
    return
  }

  accordionGroups.forEach((group, groupIndex) => {
    const activeClass = group.getAttribute(ACTIVE_CLASS_ATTRIBUTE) || DEFAULT_OPEN_CLASS
    const isMultiple = group.hasAttribute(MULTIPLE_ATTRIBUTE)
    let timelines: gsap.core.Timeline[] = []
    // set easing and duration
    const ease = group.getAttribute(EASE_ATTRIBUTE) || DEFAULT_EASE
    let duration = DEFAULT_DURATION

    // check if ease is valid
    if (!gsap.parseEase(ease)) {
      console.error(`Socks UI: Invalid ease value in accordion group ${groupIndex + 1}. Please provide a valid GSAP ease value.`)
      return
    }
    // check if duration is valid
    if (group.hasAttribute(DURATION_ATTRIBUTE)) {
      const setDuration = parseFloat(group.getAttribute(DURATION_ATTRIBUTE)!)
      if (isNaN(setDuration)) {
        console.error(`Socks UI: Invalid duration value in accordion group ${groupIndex + 1}. Please provide a valid number.`)
        return
      }
      duration = setDuration
    }

    const accordions = group.querySelectorAll(`[${ACCORDION_ROOT}]`) as NodeListOf<HTMLElement>
    // check for accordion elements
    if (accordions.length === 0) {
      console.error(`Socks UI: Could not find accordions in accordion group ${groupIndex + 1}. Make sure to add the [s-accordion="root"] attribute to your accordions.`)
      return
    }
    // check if there are no missing accordion elements attributes
    if (accordions.length < group.querySelectorAll(`[${ACCORDION_CONTENT}]`).length) {
      console.error(`Socks UI: Some accordions are missing the [s-accordion="root"] attribute in group ${groupIndex + 1}.`)
    }

    accordions.forEach((accordion, index) => {
      const trigger = accordion.querySelector(`[${ACCORDION_TRIGGER}]`) as HTMLElement
      const content = accordion.querySelector(`[${ACCORDION_CONTENT}]`) as HTMLElement
      const activeElements = accordion.querySelectorAll(`[${ADD_ACTIVE_CLASS_ATTRIBUTE}]`)

      // check for content and trigger elements
      if (!content || !trigger) {
        console.error(`Socks UI: Accordions must have a trigger and content element. Accordion ${index + 1} in group ${groupIndex + 1} is missing one of these elements.`)
        return
      }

      /**
       * Set attributes and styles
       */
      // trigger attributes
      trigger.style.cursor = 'pointer'
      if (trigger.tagName !== 'BUTTON') {
        trigger.setAttribute('role', 'button')
        trigger.setAttribute('tabindex', '0')
      }
      trigger.setAttribute('id', `accordion-trigger-${groupIndex}-${index}`)
      trigger.setAttribute('aria-expanded', 'false')
      trigger.setAttribute('aria-controls', `accordion-content-${groupIndex}-${index}`)
      // content attributes
      content.setAttribute('aria-hidden', 'true')
      content.setAttribute('role', 'region')
      content.setAttribute('id', `accordion-content-${groupIndex}-${index}`)
      content.setAttribute('aria-labelledby', `accordion-trigger-${groupIndex}-${index}`)

      gsap.set(content, { display: 'none' })
      // create timeline
      const tl = gsap.timeline({ paused: true })
      tl.set(content, { display: 'block' })
      tl.fromTo(content, {
        height: 0,
        overflow: 'hidden'
      }, {
        height: 'auto',
        duration,
        ease,
      })

      // add timeline to timelines array
      timelines.push(tl)

      // If first open attribute is present, or open attribute is present, open the accordion
      if (group.hasAttribute(FIRST_OPEN_ATTRIBUTE) && index === 0 || accordion.classList.contains(activeClass)) {
        tl.progress(1).pause()
        accordion.classList.add(activeClass)
        activeElements.forEach(element => element.classList.add(activeClass))
        // set attributes
        trigger.setAttribute('aria-expanded', 'true')
        content.setAttribute('aria-hidden', 'false')
      }

      // trigger on click or enter/space key
      trigger.addEventListener('click', toggleAccordion)
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault() // prevent space from scrolling the page
          toggleAccordion()
        }
      })

      function toggleAccordion() {
        // if "multiple" is false & it's already open & we started with one open, don't close it
        if (!isMultiple && accordion.classList.contains(activeClass) && group.hasAttribute(FIRST_OPEN_ATTRIBUTE)) return

        //toggle timeline and open attribute
        if (accordion.classList.contains(activeClass)) {
          // Close accordion
          tl.reverse()
          accordion.classList.remove(activeClass)
          activeElements.forEach(element => element.classList.remove(activeClass))
          // set attributes
          trigger.setAttribute('aria-expanded', 'false')
          content.setAttribute('aria-hidden', 'true')

          // dispatch close event
          const toggleEvent = new CustomEvent('accordion-close', { detail: accordion })
          window.dispatchEvent(toggleEvent)
        } else {
          // Open accordion
          tl.play()
          accordion.classList.add(activeClass)
          activeElements.forEach(element => element.classList.add(activeClass))
          // set attributes
          trigger.setAttribute('aria-expanded', 'true')
          content.setAttribute('aria-hidden', 'false')

          // dispatch open event
          const toggleEvent = new CustomEvent('accordion-open', { detail: accordion })
          window.dispatchEvent(toggleEvent)
        }
        // check if multiple accordions can be open at the same time
        if (isMultiple) return
        // otherwise, close all other accordions
        timelines.forEach((timeline, timelineIndex) => {
          if (timelineIndex !== index && !timeline.reversed()) {
            timeline.reverse()
            accordions[timelineIndex].classList.remove(activeClass)
            accordions[timelineIndex].querySelectorAll(`[${ADD_ACTIVE_CLASS_ATTRIBUTE}]`).forEach(element => element.classList.remove(activeClass))
          }
        })
      }
    })
  })
})()