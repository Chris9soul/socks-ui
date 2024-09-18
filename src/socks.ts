(function () {
  // the base is the same as current script, except for the file name
  // @ts-ignore // typescript doesn't know about document.currentScript
  const base: string = document.currentScript.src

  const components = ["accordion", "modal", "toc", "combobox", "carousel"]

  function loadComponent(attribute: string) {
    // create a script element
    const script = document.createElement('script')
    // if it ends with .ts, replace it with components/socks.ts
    const replaceWith = base.endsWith('.ts') ? `components/${attribute}.ts` : `${attribute}.js`

    // replace the last part with the component
    script.src = base.replace(/[^/]*$/, replaceWith)
    script.async = true
    document.head.appendChild(script)
  }

  // Check for components in the DOM 
  components.forEach(attribute => {
    if (!document.querySelector(`[s-${attribute}]`)) return
    // check if script already exists (matches "socks-ui" and attribute)
    if (document.querySelector(`script[src*="socks-ui"][src*="${attribute}"]`)) return
    loadComponent(attribute)
  })
})()
