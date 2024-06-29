/**
 * Todos/Notes:
 * - 
 */
// Socks UI Table of Contents
(function () {
  // Check if GSAP is included in the project
  if (window.gsap === undefined) {
    console.error("Socks UI: Couldn't find GSAP. Please make sure to include GSAP in your project before using Socks UI")
    return
  }

  // Main Attributes
  const TOC_ROOT = 's-toc="list"' // the list that will contain all the items
  const TOC_CONTENT = 's-toc="content"' // the content from which the titles will be extracted
  const TOC_TEXT = 's-toc="text"' // specify the text node in the template

  // Options
  const CUSTOM_SELECTOR = 's-toc-selector' // Custom selector for the headings

  let headingSelector = 'h2' // By default, look for h2 tags
  let subHeadingSelector = 'h3' // By default, look for h3 tags

  // Get reference to all elements
  const list = document.querySelector(`[${TOC_ROOT}]`)
  if (!list) {
    console.error("Socks UI: Couldn't find any list with the attribute [s-toc='list']")
    return
  }
  if (list.tagName !== 'UL' && list.tagName !== 'OL') {
    console.error("Socks UI: The element with the attribute [s-toc='list'] must be a list")
    return
  }
  // Check for custom heading selector
  const customSelectors = list.getAttribute(CUSTOM_SELECTOR)?.split(',') || []
  // check if the custom selector is valid
  if (customSelectors?.length > 0) {
    headingSelector = customSelectors[0]
    if (customSelectors.length > 1) {
      subHeadingSelector = customSelectors[1]
    }
    // check that no more than one comma is present
    if (customSelectors.length > 2) {
      console.error("Socks UI: The custom selector can only have one comma")
      return
    }
  }
  // Get the template
  const template = list.querySelector(`li`)
  if (!template) {
    console.error("Socks UI: Couldn't find a list item template")
    return
  }
  if (template.querySelector(`[${TOC_TEXT}]`) === null) {
    console.error("Socks UI: Couldn't find any text node with the attribute [s-toc='text']")
    return
  }

  // Check if the template has a sub-template
  const subTemplate = template.querySelector('li') || null

  // Get content wrapper
  const content = document.querySelector(`[${TOC_CONTENT}]`)
  if (!content) {
    console.error("Socks UI: Couldn't find any content with the attribute [s-toc='content']")
    return
  }

  // Get all headings
  const headingsToFind = subTemplate ? `${headingSelector}, ${subHeadingSelector}` : headingSelector
  const headings = content.querySelectorAll(headingsToFind)

  let tree = [] as HTMLElement[]

  headings.forEach((heading) => {
    const level = heading.tagName === headingSelector.toUpperCase() ? 1 : 2
    let templateToUse = subTemplate || template
    if (level === 1) { templateToUse = template }

    const text = heading.textContent
    if (!text) return

    heading.id = 's-' + text.replace(/\s/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')

    // Clone the template
    const clone = templateToUse.cloneNode(true) as HTMLElement
    // find the text node and replace the text
    const cloneTextNode = clone.querySelector(`[${TOC_TEXT}]`)
    if (!cloneTextNode) return
    cloneTextNode.textContent = text
    // find link and add href
    const cloneLink = clone.querySelector('a')
    if (!cloneLink) return
    cloneLink.href = `#${heading.id}`

    // Append the clone to the list
    if (level === 1) {
      tree.push(clone)
      list.appendChild(clone)
    } else {
      const parent = tree[tree.length - 1]
      if (!parent) return
      const ul = parent.querySelector('ul')
      if (!ul) return
      ul.appendChild(clone)
    }
  })
  // delete the templates
  template.remove()
  list.querySelectorAll('li ul li:first-child').forEach((li) => { li.remove() })
})()