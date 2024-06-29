(function () {
  // the base is the same as current script, except for the file name
  // @ts-ignore // typescript doesn't know about document.currentScript
  const base: string = document.currentScript.src

  const components = ["s-accordion", "s-modal", "s-toc"]

  function loadComponent(attribute: string) {
    // get the component name
    const component = attribute.replace(/^s-/, '')
    const script = document.createElement('script')
    // if it ends with .ts, replace it with components/socks.ts
    const replaceWith = base.endsWith('.ts') ? `components/${component}.ts` : `${component}.js`

    // replace the last part with the component
    script.src = base.replace(/[^/]*$/, replaceWith)
    script.async = true
    document.head.appendChild(script)
  }

  // Check for components in the DOM 
  components.forEach(attribute => {
    if (!document.querySelector(`[${attribute}]`)) return
    loadComponent(attribute)
  })
})()
