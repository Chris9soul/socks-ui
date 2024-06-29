(function () {
  // the base is the same as current script, except for the file name
  // @ts-ignore // typescript doesn't know about document.currentScript
  const base: string = document.currentScript.src

  const components = ["s-accordion", "s-modal"]

  function loadComponent(attribute: string) {
    const component = attribute.split('-')[1]
    const script = document.createElement('script')
    // if it ends with .ts, replace it with components/socks.ts
    const replaceWith = base.endsWith('.ts') ? `components/${component}.ts` : `${component}.js`

    script.src = base.replace('socks.js', replaceWith)
    script.async = true
    document.head.appendChild(script)
  }

  // Check for components in the DOM 
  components.forEach(attribute => {
    if (!document.querySelector(`[${attribute}]`)) return
    loadComponent(attribute)
  })
})()
