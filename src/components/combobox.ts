/**
 * Todos/Notes: 
 * -
 */
// Socks UI Combobox
(function () {
  // Check if GSAP is included in the project
  if (window.gsap === undefined) {
    console.error("Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI")
    return
  }

  // Main Attributes
  const COMBOBOX = 's-combobox="root"'
  const COMBOBOX_LIST = 's-combobox="list"'
  const COMBOBOX_LIST_ITEM_TEXT = 's-combobox="text"'

  // Defaults
  const DEFAULT_ACTIVE = 's-active' // Default class that will be added to the active item

  // Options
  const PREVENT_DEFAULT = 's-prevent-submit'
  const ACTIVE_CLASS = 's-active-class'

  const comboboxes = document.querySelectorAll(`[${COMBOBOX}]`) as NodeListOf<HTMLElement>
  if (!comboboxes.length) {
    console.error("Socks UI: Couldn't find any combobox with the attribute [s-combobox]")
    return
  }

  function initializeCombobox(combobox: HTMLElement, input: HTMLInputElement, list: HTMLElement) {
    let allOptions = Array.from(list.querySelectorAll('li'))
    let filteredOptions = [...allOptions]
    let currentOption: HTMLLIElement | null = null
    let isOpen = false

    // Prevent form submission
    if (combobox.hasAttribute(PREVENT_DEFAULT)) {
      const form = combobox.closest('form')
      if (!form) return
      form.addEventListener('submit', (event) => {
        event.stopImmediatePropagation()
        event.preventDefault()
      }, true)
    }

    // set active class
    const activeClass = combobox.getAttribute(ACTIVE_CLASS) || DEFAULT_ACTIVE

    function setActiveDescendant(option: HTMLElement | null) {
      if (option && isOpen) {
        input.setAttribute('aria-activedescendant', option.id)
        if (!isOptionInView(option)) {
          option.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      } else {
        input.setAttribute('aria-activedescendant', '')
      }
    }

    function isOptionInView(option: HTMLElement) {
      const bounding = option.getBoundingClientRect()
      const listBounding = list.getBoundingClientRect()
      return (
        bounding.top >= listBounding.top &&
        bounding.bottom <= listBounding.bottom
      )
    }

    function getOptionText(option: HTMLElement) {
      const textElement = option.querySelector(`[${COMBOBOX_LIST_ITEM_TEXT}]`)
      return textElement ? textElement.textContent : ''
    }

    function filterOptions() {
      const filter = input.value.toLowerCase()
      filteredOptions = allOptions.filter(option => {
        const optionText = getOptionText(option) || ''
        return optionText.toLowerCase().includes(filter)
      })
      list.innerHTML = ''
      filteredOptions.forEach(option => list.appendChild(option))
      return filteredOptions.length > 0 ? filteredOptions[0] : null
    }

    function setCurrentOptionStyle(option: HTMLElement) {
      filteredOptions.forEach(opt => {
        if (opt === option) {
          opt.setAttribute('aria-selected', 'true')
          opt.classList.add(activeClass)
        } else {
          opt.removeAttribute('aria-selected')
          opt.classList.remove(activeClass)
        }
      })
    }

    // Set the initial styles
    gsap.set(list, { display: 'none', transformOrigin: 'top center' })
    // Create a timeline for the list
    const tl = gsap.timeline({ paused: true })
      .set(list, { display: 'block' })
      .from(list, { opacity: 0, scale: 0.95, duration: 0.2 })

    function open() {
      tl.play()
      input.setAttribute('aria-expanded', 'true')
      isOpen = true
    }

    function close() {
      tl.reverse()
      input.setAttribute('aria-expanded', 'false')
      setActiveDescendant(null)
      isOpen = false
    }

    input.addEventListener('input', () => {
      const option = filterOptions()
      if (option) {
        open()
        setCurrentOptionStyle(option)
        setActiveDescendant(option)
      } else {
        close()
      }
    })

    input.addEventListener('focus', () => {
      if (filteredOptions.length > 0) {
        open()
      }
    })

    input.addEventListener('keydown', (event) => {
      if (!currentOption) { currentOption = filteredOptions[0] }
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            open()
          }
          const nextOption = filteredOptions[filteredOptions.indexOf(currentOption) + 1] || filteredOptions[0]
          setCurrentOptionStyle(nextOption)
          setActiveDescendant(nextOption)
          currentOption = nextOption
          break
        case 'ArrowUp':
          event.preventDefault()
          if (!isOpen) {
            open()
          }
          const prevOption = filteredOptions[filteredOptions.indexOf(currentOption) - 1] || filteredOptions[filteredOptions.length - 1]
          setCurrentOptionStyle(prevOption)
          setActiveDescendant(prevOption)
          currentOption = prevOption
          break
        case 'Enter':
          if (currentOption) {
            input.value = getOptionText(currentOption) || ''
            close()
          }
          break
        case 'Escape':
          close()
          break
      }
    })

    Array.from(list.children).forEach((option) => {
      option.addEventListener('click', () => {
        input.value = getOptionText(option as HTMLLIElement) || ''
        close()
      })
    })

    document.addEventListener('click', (event) => {
      if (!combobox.contains(event.target as Node)) {
        close()
      }
    })

    // set initial open state
    setCurrentOptionStyle(list.children[0] as HTMLElement)
    setActiveDescendant(list.children[0] as HTMLElement)
  }

  // Loop through all the comboboxes
  comboboxes.forEach((combobox, index) => {
    const input = combobox.querySelector('input')
    if (!input) {
      console.error(`Socks UI: Couldn't find an input inside combobox ${index}`)
      return
    }
    const list = combobox.querySelector(`[${COMBOBOX_LIST}]`) as HTMLElement
    if (!list) {
      console.error(`Socks UI: Couldn't find a list inside combobox ${index}`)
      return
    }
    // if it't not a list, add attributes to make it a list
    if (list.tagName !== 'UL' && list.tagName !== 'OL') { list.role = 'list' }

    // Set the role and aria-label for the list
    list.setAttribute('role', 'listbox')
    if (!list.hasAttribute('aria-label')) { list.setAttribute('aria-label', 'List of options') }
    if (!list.id) { list.id = `cbx-${index}-listbox` }

    // Set roles for the list items
    const listItems = Array.from(list.children) as HTMLElement[]
    listItems.forEach((item, i) => {
      item.setAttribute('role', 'option')
      if (!item.id) { item.id = `${list.id}-option-${i}` }
      item.style.cursor = 'pointer'
    })

    // Set the role and aria attributes for the input
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-autocomplete', 'both')
    input.setAttribute('aria-expanded', 'false')
    input.setAttribute('aria-controls', list.id)
    input.setAttribute('aria-activedescendant', '')
    // prevent input native autocomplete
    input.setAttribute('autocomplete', 'off')

    // Initialize the combobox
    initializeCombobox(combobox, input, list)
  })
})()